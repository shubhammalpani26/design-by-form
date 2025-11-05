-- Add columns to track 3D generation fee separately from listing fee
ALTER TABLE design_listings
ADD COLUMN three_d_fee_paid boolean NOT NULL DEFAULT false,
ADD COLUMN three_d_fee_amount numeric,
ADD COLUMN three_d_generated_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN design_listings.three_d_fee_paid IS 'Whether the designer has paid for 3D model generation (separate from listing fee)';
COMMENT ON COLUMN design_listings.three_d_fee_amount IS 'Amount paid for 3D generation in local currency';
COMMENT ON COLUMN design_listings.three_d_generated_at IS 'Timestamp when 3D model was generated';