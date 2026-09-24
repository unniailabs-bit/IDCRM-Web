-- Migration: Add credits column to trusts table
-- This enables trust-level credit management for ID card generation

-- Add credits column to trusts table
ALTER TABLE trusts 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN trusts.credits IS 'Credit balance for the trust, used for ID card generation. Credits are deducted when ID cards are generated.';

-- Optional: Initialize credits for existing trusts (set to 0 or a default value)
-- UPDATE trusts SET credits = 0 WHERE credits IS NULL;

