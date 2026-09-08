---
id: quickbooks
title: QuickBooks Online Setup
---

<!-- cspell:ignore quickbooks Miru -->

Miru can export clients, invoices, and recorded payments to QuickBooks Online.
The sync is one-way from Miru to QuickBooks, so Miru remains the source for time
entries and invoice creation.

## Before You Start

- Use a QuickBooks Online company where you can approve app connections.
- Ask your Miru host administrator to configure the QuickBooks OAuth application
  if Miru shows **OAuth credentials required**.
- Create or choose a QuickBooks service item for invoice lines. This mapping is
  required before invoices can sync.
- If you send taxable invoices, also choose the matching QuickBooks tax code.

## Connect QuickBooks

1. Open **Settings → Payment Settings → QuickBooks Online**.
2. Click **Connect QuickBooks**.
3. Sign in to Intuit and select the QuickBooks company to connect.
4. Approve the connection. Miru returns you to Payment Settings and shows the
   company name, environment, and realm ID.

## Add Mappings

Enter the numeric QuickBooks IDs that apply to your company, then click **Save
mappings**.

- **Service item ID** is required for invoice line items.
- **Tax code ID** is required only when exporting invoices with tax.
- **Deposit account ID** is optional and controls the account used for exported
  payments.
- Income and accounts-receivable account IDs are optional reference settings.
  QuickBooks normally derives those accounts from the selected service item and
  company configuration.

Use IDs from the same QuickBooks company you connected. Names such as
`Consulting` are not accepted in fields that ask for an ID.

## Sync Records

Click **Sync workspace** to queue all current Miru clients, invoices, and
payments. Miru reports how many records were queued and skips unchanged payloads
on later syncs.

When an invoice is exported, Miru creates or updates its client in QuickBooks
first.

## Verify

For the first verification, use a workspace whose current records are all safe
to export because **Sync workspace** queues every client, invoice, and payment.

1. Create a draft invoice with a known client and service item, then click
   **Sync workspace**.
2. Confirm the customer and invoice appear in the connected QuickBooks company.
3. Record and sync a payment in Miru.
4. Confirm the QuickBooks payment is linked to the exported invoice and, when
   configured, uses the selected deposit account.

If a taxable invoice fails, confirm the tax code ID. If any invoice fails,
confirm the service item ID and that the connected QuickBooks company still
authorizes Miru.

## Disconnect

Click **Disconnect** in Payment Settings to stop future exports. Existing
QuickBooks records are not deleted. Wait for a queued sync to finish first:
disconnecting does not cancel exports that are already queued or in progress.
