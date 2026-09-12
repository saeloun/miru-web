---
id: paypal
title: PayPal Setup
---

PayPal lets clients pay supported invoices from their PayPal account. Miru captures the approved payment, marks the invoice paid, and reconciles completed payments through PayPal webhooks.

## Before You Start

- Use a PayPal Business account.
- Create a REST app in the PayPal Developer Dashboard.
- Keep the Client Secret private. Miru stores it encrypted and only shows whether it is configured.

## Connect PayPal

1. Open **Settings → Payment Settings → PayPal**.
2. Create or open a live REST app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/live).
3. Copy the Client ID and Client Secret.
4. Paste both credentials into Miru.
5. Keep **Show PayPal on invoices** enabled.
6. Click **Save PayPal**.

## Sandbox Testing

Enable **Sandbox mode** in Miru, then use credentials from a sandbox REST app. Pay an invoice with a PayPal sandbox buyer account. Disable Sandbox mode and save live credentials before accepting real payments.

## Webhooks

Miru automatically registers this endpoint on the PayPal REST app:

```text
https://app.miru.so/webhooks/paypal/events
```

It subscribes to:

- `PAYMENT.CAPTURE.COMPLETED`
- `CHECKOUT.ORDER.APPROVED`

If Payment Settings shows **Webhook not registered**, save the PayPal connection from a Miru installation available at a public HTTPS URL. Local HTTP addresses cannot receive a PayPal webhook registration.

## Supported Currencies

PayPal invoice payments are available for:

- AUD
- BRL
- CAD
- CNY
- CZK
- DKK
- EUR
- HKD
- HUF
- ILS
- JPY
- MYR
- MXN
- TWD
- NZD
- NOK
- PHP
- PLN
- GBP
- RUB
- SGD
- SEK
- CHF
- THB
- USD

## How Clients Pay

1. The client opens the public invoice and clicks **Pay with PayPal**.
2. PayPal asks the client to approve the payment.
3. Miru captures the payment when PayPal returns the client to the invoice.
4. Miru marks the invoice paid and sends payment confirmation emails.
5. PayPal webhooks reconcile completed or approved payments if the browser return is interrupted.
