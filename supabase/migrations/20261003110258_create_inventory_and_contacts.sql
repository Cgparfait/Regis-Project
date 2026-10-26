/*
# Create inventory items and contact submissions tables

1. New Tables
- `inventory_items`
  - `id` (uuid, primary key)
  - `name` (text, not null) — name of the clothing item
  - `category` (text, not null) — e.g. "Dresses", "Outerwear", "Tops", "Bottoms", "Accessories"
  - `size` (text) — available size(s)
  - `price` (numeric, default null) — optional price
  - `description` (text) — item description
  - `image_url` (text, not null) — URL to the item photo
  - `status` (text, default 'Available') — "Available" or "Sold"
  - `created_at` (timestamptz, default now())

- `contact_submissions`
  - `id` (uuid, primary key)
  - `name` (text, not null) — sender's name
  - `email` (text, not null) — sender's email
  - `message` (text, not null) — inquiry body
  - `item_name` (text, default null) — optional: which item they're asking about
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- `inventory_items` is intentionally public (no auth): anon + authenticated can read; only anon + authenticated can insert/update/delete for demo simplicity.
- `contact_submissions` is public-write: anyone can submit a contact request (anon + authenticated insert). Read is also anon + authenticated since this is a single-tenant showcase site with no login screen.
*/

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  size text,
  price numeric,
  description text,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'Available',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_inventory" ON inventory_items;
CREATE POLICY "anon_select_inventory"
  ON inventory_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory_items;
CREATE POLICY "anon_insert_inventory"
  ON inventory_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inventory" ON inventory_items;
CREATE POLICY "anon_update_inventory"
  ON inventory_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory_items;
CREATE POLICY "anon_delete_inventory"
  ON inventory_items FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  item_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contacts" ON contact_submissions;
CREATE POLICY "anon_select_contacts"
  ON contact_submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contacts" ON contact_submissions;
CREATE POLICY "anon_insert_contacts"
  ON contact_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contacts" ON contact_submissions;
CREATE POLICY "anon_update_contacts"
  ON contact_submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contacts" ON contact_submissions;
CREATE POLICY "anon_delete_contacts"
  ON contact_submissions FOR DELETE
  TO anon, authenticated USING (true);
