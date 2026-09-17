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
5. Keep **Show PayPal on invoices** on and turn on **Enabled**.
6. Click **Save PayPal**.

Clients see PayPal only when both switches are on. If the card shows **Connected** but no invoice offers PayPal, turn on **Enabled** and save again.

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

PayPal stays off your invoices until the webhook is registered. Without it Miru cannot confirm a payment whose browser return was interrupted, so the button is hidden rather than risk an unreconciled charge.

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

Japanese yen, Hungarian forint, and New Taiwan dollar have no decimal places at PayPal. An invoice in those currencies must total a whole number, otherwise PayPal cannot be used for it and the client sees an error instead of the payment page.

## Troubleshooting

**"Client Authentication failed" when saving.** The credentials do not match the environment. Sandbox credentials need **Sandbox mode** on; live credentials need it off. Copy them again from the matching PayPal dashboard.

**Connected, but no invoice offers PayPal.** Turn on **Enabled**, keep **Show PayPal on invoices** on, and check that the webhook row reads Webhook registered. All three are required.

**A client says they paid but the invoice is unpaid.** Do not ask them to pay again. In the matching Sandbox or Live PayPal dashboard, find the transaction by invoice number, client, amount, and payment time, then copy its order or capture ID. In **Settings > Payments**, confirm the environment is correct and PayPal still says **Connected** and **Webhook registered**. Check the event in the PayPal webhook deliveries page and resend it if PayPal offers that action. If the invoice remains unpaid, email [Miru support](mailto:hello@saeloun.com) with the workspace name, invoice number, and PayPal order or capture ID so the capture can be reconciled.

## How Clients Pay

1. The client opens the public invoice and clicks **Pay with PayPal**.
2. PayPal asks the client to approve the payment.
3. Miru captures the payment when PayPal returns the client to the invoice.
4. Miru marks the invoice paid and sends payment confirmation emails.
5. PayPal webhooks reconcile completed or approved payments if the browser return is interrupted.
