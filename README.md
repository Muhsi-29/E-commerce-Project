# Shoyo storefront

The customer-facing website of the Shoyo marketplace: shopping, checkout, accounts, and the seller dashboard.
It talks to the Shoyo API in the sibling `backend` folder; store management lives in the separate `Admin-Panel` app.

```
Project_Resume/
  backend/             <- API (start this first)
  E-Commerce Website/  <- this project
  Admin-Panel/         <- admin panel
```

**Stack:** React 19, TypeScript, Vite, React Router, Axios, lucide icons.

## Run

1. Start the API: `npm run dev` in `../backend` (see its README for first-time setup and logins).
2. Here: `npm install`, then `npm run dev`. Open http://localhost:5173.

To use a different API or admin panel address, copy `.env.example` to `.env` and change `VITE_API_URL` / `VITE_ADMIN_URL`.

## Features

- **Shopping:** home page with deals and recently viewed, search with suggestions and typo tolerance, filters (category,
  brand, price, rating, discount, in stock), product pages with gallery, specs, seller info, delivery date by PIN code,
  reviews and "frequently bought together".
- **Cart and checkout:** guest cart (merged on login), save for later, coupons, saved addresses, cash on delivery,
  UPI via Razorpay and cards via Stripe (shown when the API has keys).
- **Orders:** tracking per shipment, cancel, return and refund requests, rate the seller, printable invoice.
- **Account:** profile, password change, forgot/reset password, saved addresses, wishlist.
- **Sellers:** apply on `/sell`; approved sellers get a dashboard at `/seller` (products, orders to ship, returns,
  payouts, store settings) and a public store page at `/store/<name>`.
- **Help:** shipping, returns, privacy and terms pages, contact form, newsletter sign-up.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 5173 |
| `npm run lint` | oxlint |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the built site |

## Deploy

- **Docker:** the `Dockerfile` builds the site and serves it with Nginx (`VITE_API_URL` and `VITE_ADMIN_URL` are build args).
  `docker compose up --build` in `../backend` runs it together with the API and admin panel.
- **Render:** `render.yaml` deploys it as a static site.
- **CI:** `.github/workflows/ci.yml` lints and builds on every push and pull request.
