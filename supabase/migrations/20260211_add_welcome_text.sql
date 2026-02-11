-- Add welcome_text, cover_image_url, and font_preset columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS welcome_text text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS font_preset text;
