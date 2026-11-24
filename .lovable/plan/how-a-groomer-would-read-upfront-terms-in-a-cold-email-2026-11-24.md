# How a groomer would read upfront terms in a cold email

## Honest read, from the groomer's side
- **What works:** Clear numbers ("your clients get 5% off, you get 20% of every order, 30% on Statement") show there's no catch. Busy owners like knowing what's in it for them in one line.
- **What can feel off:**
  - Leading with commission makes it sound like a sales pitch before they care about the product. A groomer first asks: "Would my clients love this? Will it make me look good?"
  - "20% of purchase amount" invites the question "how do I get paid, and how do you track it?" With no clear answer, it can seem flimsy.
  - Three numbers in a first email can feel like a contract. Too much, too early.
- **What earns trust faster:** one real finished-piece photo (Chente or Hampton), one sentence on why their clients would want it, then the terms in a single short line, and a simple next step ("Want a free display piece for your front desk?").

## Suggested change (only if you approve)
1. Reorder the shop emails: hook about their clients → real photo link → terms in one line → offer of a display piece or a sample code → "Reply 'no thanks' and I won't email again."
2. Add one plain line on payment: "Paid monthly by bank transfer/PayPal for delivered orders." Shares are still settled by hand.
3. Keep exact numbers, no "up to" or ranges.
4. Update the 6 queued vet/groomer drafts to match. Send nothing.

## Technical notes
- Edit the business prompt/template in `supabase/functions/outreach-admin` (`ensurePartnerShare` stays), update its test, redeploy, and patch the 6 pending drafts in the database.
