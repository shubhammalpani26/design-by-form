

## Fix: Admin Panel Failing to Load Pending Products

### Root Cause

The database logs show the query from the Products tab is **timing out** every time it runs. The exact query:

```text
SELECT designer_products.*, designer_profiles(name, email, phone_number)
FROM designer_products
ORDER BY created_at DESC
```

is hitting the statement timeout limit. This happens because:

1. **No indexes on key columns** -- `designer_products` has no index on `designer_id` (used in the JOIN) or `status` (used for filtering). This forces full table scans.

2. **Nested RLS evaluation** -- The single query joins two tables that both have RLS policies calling the `has_role()` function. For each row, PostgreSQL must evaluate multiple RLS policies, each triggering subqueries to `user_roles`. When combined with the lateral join, this creates cascading subqueries.

3. **Redundant RLS policy** -- The `designer_profiles` table has a policy with `OR true` that still calls `has_role()` unnecessarily, adding overhead on every row.

### Fix (3 parts)

#### Part 1: Add Database Indexes

Add missing indexes to speed up RLS evaluation and joins:

- `designer_products(designer_id)` -- for the JOIN to designer_profiles
- `designer_products(status)` -- for filtering by pending/approved/rejected
- `designer_products(created_at)` -- for ORDER BY

#### Part 2: Simplify Redundant RLS Policy

The `designer_profiles` policy "Anyone can view approved designer profiles (safe columns)" currently has:

```text
(status = 'approved') AND (auth.uid() = user_id OR has_role(...) OR true)
```

The `OR true` makes the inner condition always pass, but PostgreSQL may still evaluate `has_role()` before short-circuiting. This policy will be simplified to just `status = 'approved'`, removing the unnecessary function call.

#### Part 3: Split the Query in Frontend Code

Modify `ProductsManagement.tsx` to avoid the lateral join that triggers nested RLS:

**Current approach (1 query with join -- times out):**
```text
supabase.from("designer_products")
  .select("*, designer_profiles(name, email, phone_number)")
```

**New approach (2 simple queries -- no nested RLS):**
```text
Step 1: Fetch products (RLS on designer_products only)
Step 2: Fetch designer profiles by ID (RLS on designer_profiles only)
Step 3: Merge in JavaScript
```

This avoids nested RLS evaluation entirely by keeping each query to a single table.

### Files Changed

- **Database migration**: Add 3 indexes, simplify 1 RLS policy
- **src/components/admin/ProductsManagement.tsx**: Split the joined query into two separate queries and merge results in code

