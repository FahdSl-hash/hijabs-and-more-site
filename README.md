# Hijabs & More by Fatima — Website Setup Guide

Your site has three pieces:
1. **The website** (this folder) — hosted free on Netlify
2. **Supabase** — free database that stores products and orders, plus photo storage
3. **Paystack** — takes online payments straight to your bank account

Follow these steps in order. None of it requires coding — just filling in forms and copying/pasting a few keys.

---

## Step 1 — Create your Supabase project

1. Go to https://supabase.com → **Start your project** → sign up (free).
2. Click **New project**. Name it `hijabs-and-more`, set a database password (save it somewhere safe), pick a region close to Nigeria (e.g. `eu-west` or `eu-central`).
3. Once it's ready, go to **SQL Editor** (left sidebar) → **New query**, paste this in, and click **Run**:

```sql
-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  section text not null,
  name text not null,
  price numeric not null,
  discount numeric default 0,
  size text,
  color text,
  material text,
  design text,
  style text,
  image_url text,
  in_stock boolean default true
);

-- Orders table (filled automatically when a customer pays online)
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  customer_name text,
  phone text,
  email text,
  address text,
  items jsonb,
  total numeric,
  payment_ref text,
  status text default 'paid'
);

-- Allow the public website to READ products (but not edit them)
alter table products enable row level security;
create policy "Public can view products" on products for select using (true);

-- Only logged-in admin (Fatima) can add/edit/delete products
create policy "Admin can manage products" on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Allow the public website to CREATE orders (checkout), not read others' orders
alter table orders enable row level security;
create policy "Public can create orders" on orders for insert with check (true);
create policy "Admin can view orders" on orders for select using (auth.role() = 'authenticated');
```

4. Go to **Storage** (left sidebar) → **New bucket** → name it `product-images` → toggle **Public bucket** ON → Create.

5. Go to **Authentication** → **Users** → **Add user** → enter Fatima's email and a password. This is what she'll use to log into the admin panel at `yoursite.com/admin.html`. (You can also do this for yourself if you'll help manage it.)

6. Go to **Project Settings** → **API**. Copy:
   - **Project URL**
   - **anon public** key

   Open `js/supabase-config.js` in this folder and paste them in:
   ```js
   const SUPABASE_URL = "paste project URL here";
   const SUPABASE_ANON_KEY = "paste anon public key here";
   ```

---

## Step 2 — Create a Paystack account (for online payments)

1. Go to https://paystack.com → **Sign up** using Fatima's business details and her bank account.
2. Complete the KYC verification (they'll ask for ID/BVN — required for payouts to land in her account).
3. Once approved, go to **Settings → API Keys & Webhooks**. Copy the **Public Key** (starts with `pk_`).
4. Open `js/supabase-config.js` and paste it in:
   ```js
   const PAYSTACK_PUBLIC_KEY = "pk_...";
   ```
5. Start in **Test Mode** to try the checkout without real money, then switch to **Live Mode** once you've confirmed everything works (Paystack dashboard toggle).

> Customers who'd rather not pay online can still tap "Order via WhatsApp" — that flow doesn't need Paystack at all.

---

## Step 3 — Put the site on GitHub + Netlify

Since you already have a GitHub → Netlify workflow from the Academy site, this will feel familiar:

1. Create a new GitHub repo (e.g. `hijabs-and-more-site`) and push this folder to it.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings: leave **Build command** blank and **Publish directory** as `/` (this is a plain static site, no build step needed).
4. Deploy. Netlify gives you a free `*.netlify.app` URL immediately — you can add a custom domain later (e.g. `hijabsandmore.com`) under **Domain settings**.

---

## Step 4 — Try it out

- Visit `yoursite.netlify.app/admin.html`, log in with the email/password from Step 1.5, and add a test product with a photo.
- Visit `yoursite.netlify.app` — it should appear in the right category.
- Try "Add to cart" → "Checkout & Pay Online" with a Paystack **test card** (Paystack's docs list test card numbers) to confirm payments work before going live.

---

## Ongoing: how Fatima manages products day-to-day

- Go to `yoursite.netlify.app/admin.html`
- Log in with her email/password
- **Add a product**: pick section → fill in name, size/color/etc. (fields change based on category) → set price and discount → upload a photo → Publish
- **Edit or hide a product**: find it in "Your Products" below the form → Edit / Hide / Delete
- No coding, no contacting you — changes appear on the live site within seconds.

---

## Notes for later (optional upgrades)

- **Payment verification**: right now, Paystack confirms payment client-side. For extra security against tampered requests, a small Netlify Function that verifies the transaction server-side (using Paystack's *secret* key) can be added later — happy to build that when you're ready to go fully live with real money.
- **Order notifications**: we can wire up an email or WhatsApp alert to Fatima every time a paid order comes in, using Supabase's built-in triggers or a Netlify Function.
