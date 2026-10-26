import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually (no dotenv dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    var idx = trimmed.indexOf('=');
    if (idx === -1) return;
    var key = trimmed.slice(0, idx).trim();
    var val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ---------- Public API ---------- */

app.get('/api/inventory', async (req, res) => {
  const { category } = req.query;
  let query = supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: 'Unable to fetch inventory' });
  }
  res.json(data);
});

app.get('/api/slides', async (req, res) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, image_url')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    return res.status(500).json({ error: 'Unable to fetch slides' });
  }
  res.json(data);
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message, item_name } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    item_name: item_name ? item_name.trim() : null,
  });

  if (error) {
    return res.status(500).json({ error: 'Unable to submit message' });
  }

  res.json({ success: true });
});

/* ---------- Auth API ---------- */

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    access_token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data.session) {
    return res.json({ success: true, message: 'Account created. Please sign in.' });
  }

  res.json({
    access_token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

/* ---------- Auth helper for admin routes ---------- */

async function getAuthClient(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  return client;
}

/* ---------- Admin: Inventory CRUD ---------- */

app.get('/api/admin/inventory', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await client
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Unable to fetch inventory' });
  res.json(data);
});

app.post('/api/admin/inventory', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { name, category, size, price, description, image_url, status } = req.body;

  if (!name || !category || !image_url) {
    return res.status(400).json({ error: 'Name, category, and image URL are required' });
  }

  const { data, error } = await client
    .from('inventory_items')
    .insert({
      name: name.trim(),
      category: category.trim(),
      size: size ? size.trim() : null,
      price: price ? Number(price) : null,
      description: description ? description.trim() : null,
      image_url: image_url.trim(),
      status: status || 'Available',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Unable to create item' });
  res.json(data);
});

app.put('/api/admin/inventory/:id', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const updates = {};
  const allowed = ['name', 'category', 'size', 'price', 'description', 'image_url', 'status'];

  allowed.forEach(function (field) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'price' ? (req.body[field] ? Number(req.body[field]) : null) : req.body[field];
    }
  });

  const { data, error } = await client
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Unable to update item' });
  res.json(data);
});

app.delete('/api/admin/inventory/:id', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { error } = await client.from('inventory_items').delete().eq('id', id);

  if (error) return res.status(500).json({ error: 'Unable to delete item' });
  res.json({ success: true });
});

/* ---------- Admin: Contact Submissions ---------- */

app.get('/api/admin/contacts', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await client
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Unable to fetch contacts' });
  res.json(data);
});

app.delete('/api/admin/contacts/:id', async (req, res) => {
  const client = await getAuthClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { error } = await client.from('contact_submissions').delete().eq('id', id);

  if (error) return res.status(500).json({ error: 'Unable to delete contact' });
  res.json({ success: true });
});

/* ---------- Page routes ---------- */

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`IMYENDA server running on http://localhost:${PORT}`);
});
