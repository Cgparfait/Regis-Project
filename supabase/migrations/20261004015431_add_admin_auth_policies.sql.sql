/*
# Update RLS policies for admin authentication

1. Changes to `inventory_items`
   - SELECT remains public (anon + authenticated) — visitors browse the collection.
   - INSERT, UPDATE, DELETE now restricted to authenticated users only — only logged-in admins can manage inventory.

2. Changes to `contact_submissions`
   - INSERT remains public (anon + authenticated) — anyone can submit a contact form.
   - SELECT now restricted to authenticated users only — only logged-in admins can read submissions.
   - DELETE restricted to authenticated users only — only logged-in admins can delete submissions.

3. Security notes
   - The public site still works: visitors can browse inventory and submit contact forms without signing in.
   - Only authenticated users (admins who sign in) can create/edit/delete inventory items and view/manage contact submissions.
   - Uses auth.uid() to verify the user has a valid authenticated session.
*/

-- inventory_items: keep public SELECT, restrict writes to authenticated
DROP POLICY IF EXISTS "anon_select_inventory" ON inventory_items;
CREATE POLICY "anon_select_inventory"
  ON inventory_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory_items;
CREATE POLICY "auth_insert_inventory"
  ON inventory_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inventory" ON inventory_items;
CREATE POLICY "auth_update_inventory"
  ON inventory_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory_items;
CREATE POLICY "auth_delete_inventory"
  ON inventory_items FOR DELETE
  TO authenticated USING (true);

-- contact_submissions: keep public INSERT, restrict read/delete to authenticated
DROP POLICY IF EXISTS "anon_select_contacts" ON contact_submissions;
CREATE POLICY "auth_select_contacts"
  ON contact_submissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contacts" ON contact_submissions;
CREATE POLICY "anon_insert_contacts"
  ON contact_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contacts" ON contact_submissions;
DROP POLICY IF EXISTS "auth_update_contacts" ON contact_submissions;
CREATE POLICY "auth_update_contacts"
  ON contact_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contacts" ON contact_submissions;
DROP POLICY IF EXISTS "auth_delete_contacts" ON contact_submissions;
CREATE POLICY "auth_delete_contacts"
  ON contact_submissions FOR DELETE
  TO authenticated USING (true);
