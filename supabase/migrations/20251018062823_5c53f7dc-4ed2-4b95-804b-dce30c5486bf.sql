-- Update commission tiers to start from 10%
DELETE FROM commission_tiers;

INSERT INTO commission_tiers (tier_name, min_sales, max_sales, commission_rate) VALUES
('Starter', 0, 5, 0.10),
('Growing', 6, 20, 0.15),
('Established', 21, 50, 0.20),
('Professional', 51, 100, 0.25),
('Elite', 101, NULL, 0.30);

-- Add bank details fields to designer_profiles
ALTER TABLE designer_profiles
ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS bank_swift_code TEXT,
ADD COLUMN IF NOT EXISTS bank_iban TEXT,
ADD COLUMN IF NOT EXISTS bank_country TEXT,
ADD COLUMN IF NOT EXISTS bank_details_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN designer_profiles.bank_account_holder_name IS 'Name on bank account';
COMMENT ON COLUMN designer_profiles.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN designer_profiles.bank_ifsc_code IS 'IFSC code for Indian bank accounts';
COMMENT ON COLUMN designer_profiles.bank_swift_code IS 'SWIFT/BIC code for international transfers';
COMMENT ON COLUMN designer_profiles.bank_iban IS 'IBAN for international transfers';
COMMENT ON COLUMN designer_profiles.bank_country IS 'Country of bank account (India or International)';
COMMENT ON COLUMN designer_profiles.bank_details_verified IS 'Whether bank details have been verified by admin';