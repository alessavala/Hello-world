# Hello-world

Hello there, I want to get some feedback about my coding, I'm starting in this world and in a few years I want to be a developer at my own start up or in a great company.
I'm studying daily, in one year I'll be a developer.

## Project: Referral Rewards — Shopify App

An embedded Shopify app that runs a "give and get" referral program:
customers get a unique link to share, their friends get a discount on their
first order, and the referrer earns a reward discount once the referred
order is paid.

Built with the standard Shopify stack: [Remix](https://remix.run/),
[Polaris](https://polaris.shopify.com/), [App Bridge](https://shopify.dev/docs/api/app-bridge),
and [Prisma](https://www.prisma.io/) for storage.

### How the referral flow works

1. A logged-in customer opens the **referral widget** (a theme app extension
   block you add to your storefront, e.g. the customer account page). It
   calls the app proxy at `/apps/referrals/link`, which creates — or reuses —
   a unique code like `REF-7K2QAB1X` for that customer, together with a
   Shopify discount code of the same value the customer can share.
2. The customer shares their link: `https://{shop}/apps/referrals/click?code=REF-7K2QAB1X`.
3. When a friend clicks it, the app records the click and redirects to
   Shopify's native discount deep link (`/discount/{code}?redirect=/`),
   which applies the referee's discount automatically.
4. When the friend's order is paid, the `orders/paid` webhook checks whether
   a referral code was used. If so, it creates a new reward discount code
   (`THX-XXXXXXXX`) for the original referrer and records the referral.
5. Merchants see participants, clicks, completed referrals and issued
   rewards on the app dashboard (`/app`), the full referral log
   (`/app/referrals`), and can tune reward percentages and code validity in
   `/app/settings`.

### Project structure

```
app/
  routes/
    app.tsx                 # Embedded admin layout + nav
    app._index.tsx           # Dashboard with program stats
    app.referrals.tsx        # Table of completed referrals & reward status
    app.settings.tsx         # Reward % and program on/off toggle
    auth.$.tsx, auth.login/  # Shopify OAuth
    proxy.link.tsx           # App proxy: get/create a customer's referral code
    proxy.click.tsx          # App proxy: track a click, redirect to checkout discount
    webhooks.orders.paid.tsx     # Issue the referrer's reward after a paid order
    webhooks.app.uninstalled.tsx # Clean up sessions on uninstall
  models/referrals.server.ts # All referral business logic (Shopify Admin GraphQL + Prisma)
  shopify.server.ts          # Shopify app/OAuth/webhook configuration
  db.server.ts                # Prisma client
prisma/schema.prisma          # Session, ReferralSettings, ReferralCode, Referral models
extensions/referral-widget/   # Theme app extension: storefront "share your link" block
```

### Setup

1. **Prerequisites**: a [Shopify Partner account](https://partners.shopify.com/),
   a development store, and the [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
   (`npm install -g @shopify/cli@latest`).
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in `SHOPIFY_API_KEY` /
   `SHOPIFY_API_SECRET` once you've created the app in the Partner Dashboard
   (or let `shopify app dev` create it for you).
4. Set up the database:
   ```sh
   npx prisma migrate dev --name init
   ```
5. Link the app config and start the dev server (this tunnels your app,
   updates `shopify.app.toml`, and installs it on your dev store):
   ```sh
   npm run config:link
   npm run dev
   ```
6. In the theme editor, add the **Referral link** block (from the
   `referral-widget` extension) to your customer account page or any page
   where logged-in customers land after checkout.

### Deploying

```sh
npm run build
npm run deploy   # pushes app config + extensions to Shopify
```

Run the app itself (`npm start`) behind whatever host you use for the
`SHOPIFY_APP_URL` configured in `shopify.app.toml`, with a production
database configured via `DATABASE_URL` (swap the Prisma `sqlite` provider
for `postgresql` or `mysql` in `prisma/schema.prisma` for production use).

### Design decisions / assumptions

- Rewards are percentage-off discount codes generated through the Admin
  GraphQL API (`discountCodeBasicCreate`), not cash or store credit — this
  needs no extra payment infrastructure and works with Shopify's native
  checkout.
- Attribution is done via the discount code actually redeemed on the paid
  order, so it works even if the shopper doesn't click through the app's
  own redirect (e.g. they type the code in manually).
- Default rewards are 10% off for both sides and codes are valid for 30
  days; merchants can change both from **Settings** at any time.
