# Shadcnblocks.com - Admin Kit

A premium Shadcn admin dashboard by shadcnblocks.com

## Getting Started

Install dependencies

```bash
pnpm install
```

Start the server

```bash
pnpm run dev
```

## Google Maps Places Autocomplete

To enable address autocomplete in the Pricing Engine:

1) Create an `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

2) In Google Cloud Console, restrict the key:
- Application restrictions: HTTP referrers (web sites)
- API restrictions: Maps JavaScript API and Places API

3) Restart the dev server after adding the env.

## Tech Stack

- shadcn/ui
- TailwindCSS v4
- Next.js
- React 19
- TypeScript
- Eslint v9
- Prettier

---

## Webhook Payload (Pricing Engine → Programs)

When a user clicks "Calculate" on the Pricing Engine page, the app POSTs a JSON payload to every Program webhook URL that matches:

- `organization_id` = the user’s active organization
- `loan_type` = the selected Loan Type (dscr | bridge)
- `status` = active

The payload contains only the currently-visible inputs (hidden/conditional fields are omitted). Field names and types:

```jsonc
{
  "loan_type": "dscr | bridge",
  "transaction_type": "purchase | delayed-purchase | rt-refi | co-refi",
  "property_type": "single | pud | condo | mf2_4 | mf5_10",
  "num_units": 1,                      // number (when visible)
  "request_max_leverage": true,        // boolean

  "address": {
    "street": "123 Main St",
    "apt": "Unit/Apt",
    "city": "City",
    "state": "CA",
    "zip": "90210",
    "county": "Los Angeles"
  },

  "gla_sq_ft": "1200",                 // strings for currency/number-like inputs
  "purchase_price": "350000",
  "loan_amount": "300000",
  "admin_fee": "0.00",
  "payoff_amount": "0.00",
  "aiv": "0.00",
  "arv": "0.00",
  "rehab_budget": "0.00",
  "rehab_holdback": "0.00",
  "emd": "0.00",

  "taxes_annual": "0.00",
  "hoi_annual": "0.00",
  "flood_annual": "0.00",
  "hoa_annual": "0.00",
  "hoi_premium": "0.00",
  "flood_premium": "0.00",
  "mortgage_debt": "0.00",

  "closing_date": "2025-11-19T00:00:00.000Z",

  // Included only when visible / applicable:
  "acquisition_date": "2025-05-01T00:00:00.000Z",   // present when transaction_type !== "purchase"
  "bridge_type": "bridge | bridge-rehab | ground-up" // present when loan_type === "bridge"
}
```

### Dropdowns and Allowed Values

- **Loan Type**
  - `dscr`, `bridge`
- **Transaction Type**
  - `purchase`, `delayed-purchase`, `rt-refi` (Refi Rate/Term), `co-refi` (Refi Cash Out)
- **Borrower Type**
  - `entity`, `individual` (UI only; not currently emitted in payload)
- **Citizenship**
  - `us` (U.S. Citizen), `pr` (Permanent Resident), `npr` (Non‑Permanent Resident), `fn` (Foreign National)  
  (UI only; not currently emitted in payload)
- **Property Type**
  - `single`, `pud`, `condo`, `mf2_4`, `mf5_10`  
  Note: `mf5_10` is hidden when Loan Type is `dscr`.
- **Number of Units**
  - Depends on Property Type:
    - `single` → 1
    - `mf2_4` → 2, 3, 4
    - `mf5_10` → 5..10
- **Loan Structure** (DSCR only)
  - `fixed-30` (30 Year Fixed), `io` (Interest Only)
- **PPP** (DSCR only)
  - `5-4-3-2-1`, `3-2-1`, `1`
- **Bridge Type** (Bridge only)
  - `bridge`, `bridge-rehab`, `ground-up`
- **Term** (Bridge only)
  - `12`, `15`, `18` (months)
- **Booleans / Toggles**
  - Request Max Leverage → `true | false`
  - Other yes/no toggles (e.g., STR, FTHB, Declining Market) are rendered in the UI but are not yet included in the webhook payload.

### Example Request Sent to Program Webhooks

```http
POST https://example.com/my-program-webhook
Content-Type: application/json

{
  "loan_type": "dscr",
  "transaction_type": "purchase",
  "property_type": "single",
  "num_units": 1,
  "request_max_leverage": false,
  "address": {
    "street": "123 Main St",
    "apt": "A",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "county": "Travis"
  },
  "gla_sq_ft": "1200",
  "purchase_price": "350000",
  "loan_amount": "300000",
  "admin_fee": "0.00",
  "payoff_amount": "0.00",
  "aiv": "0.00",
  "arv": "0.00",
  "rehab_budget": "0.00",
  "rehab_holdback": "0.00",
  "emd": "2000",
  "taxes_annual": "3000",
  "hoi_annual": "1800",
  "flood_annual": "0.00",
  "hoa_annual": "0.00",
  "hoi_premium": "0.00",
  "flood_premium": "0.00",
  "mortgage_debt": "0.00",
  "closing_date": "2025-11-19T00:00:00.000Z"
}
```

If you need additional UI fields included in the payload (e.g., Borrower Type, STR/Declining toggles), add them to the `buildPayload()` function used by the Pricing Engine page and they will be forwarded to all matching Program webhooks.
