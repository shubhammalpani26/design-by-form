# Designer Payment Flow Documentation

## Overview
This document explains how designers receive payments for their furniture designs sold through the Forma platform.

## Payment Setup Process

### 1. Bank Details Collection
**Location:** `/designer-bank-details`

Designers must provide their banking information to receive payments:

#### For Indian Designers:
- Account Holder Name
- Bank Account Number
- IFSC Code

#### For International Designers:
- Account Holder Name
- Bank Account Number
- SWIFT Code
- IBAN (International Bank Account Number)

**Security:** All bank details are encrypted and stored securely in the `designer_profiles` table.

## Earnings Flow

### 1. Sale Transaction
When a customer purchases a designer's product:
- System calculates royalty based on the designer's markup
- Commission is calculated based on the designer's sales tier
- Earnings are recorded in `designer_earnings` table with status `pending`

### 2. Earnings Calculation
```
Sale Amount = Designer's Price × Quantity
Commission = Sale Amount × Commission Rate
Royalty = Sale Amount - Commission
```

Default commission structure:
- New designers: Higher commission rate
- As sales increase: Commission rate decreases (tier-based)

### 3. Payout Request
**Location:** `/payout-requests`

**Minimum Payout:** ₹5,000 (or $100 for international)

When designers have sufficient balance:
1. Designer requests payout
2. System validates:
   - Available balance ≥ minimum payout
   - Bank details are complete
   - No pending payout requests
3. Request is created with status `pending`

### 4. Admin Approval
**Location:** `/admin/payouts`

Admin team reviews requests:
- Verifies bank account details
- Checks for fraudulent activity
- Approves or rejects with reason

### 5. Payment Processing
Once approved:
1. Admin initiates bank transfer
2. Updates request status to `paid`
3. Records `processed_at` timestamp
4. Marks corresponding earnings as paid in `designer_earnings` table

### 6. Designer Notification
Designers receive in-app notifications at each stage:
- Payout request submitted
- Request approved/rejected
- Payment completed

## Database Tables

### designer_profiles
Stores bank account information:
- `bank_account_holder_name`
- `bank_account_number`
- `bank_ifsc_code` (India)
- `bank_swift_code` (International)
- `bank_iban` (International)
- `bank_country`

### designer_earnings
Tracks all earnings:
- `sale_amount`: Total sale price
- `royalty_amount`: Designer's earning
- `commission_amount`: Platform commission
- `status`: pending/paid
- `paid_at`: Timestamp when paid

### payout_requests
Manages withdrawal requests:
- `amount`: Requested amount
- `status`: pending/approved/rejected/paid
- `bank_account_*`: Snapshot of bank details at request time
- `rejection_reason`: If rejected
- `processed_at`: When payment was made

## Security Measures

1. **RLS Policies:** Only designers can view their own earnings and payouts
2. **Bank Detail Encryption:** Sensitive information is stored securely
3. **Admin Verification:** All payouts require manual admin approval
4. **Audit Trail:** Complete history of all transactions
5. **Minimum Thresholds:** Prevents micro-transaction fraud

## Contact for Payment Issues

**Admin Team:**
- Shubham Malpani: +91 96193 83240, shubham.malpani@cyanique.com
- Tejal Agawane: +91 87795 18787, tejal.agawane@cyanique.com

**Support Hours:** Mon-Fri: 9 AM - 6 PM IST

## Future Enhancements

1. **Automated Payments:** Integration with payment gateways (Razorpay/Stripe)
2. **Multi-currency Support:** Automatic currency conversion
3. **Tax Documentation:** W-9/W-8 forms for tax compliance
4. **Payment Schedules:** Monthly automated payouts
5. **Payment Methods:** UPI, PayPal, Wire Transfer options
