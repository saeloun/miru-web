---
id: razorpay
title: Razorpay Setup
---

Razorpay lets India-based teams collect INR invoice payments through Payment Links. Customers can pay with the methods enabled in your Razorpay Dashboard, including UPI, Indian credit and debit cards, netbanking, and wallets.

## Before You Start

- Use a Razorpay account with live API keys.
- Activate RazorpayX before enabling UPI payouts.
- Keep the Razorpay Key Secret and webhook secret private. Miru stores them encrypted and only shows whether they are configured.

## Connect Razorpay

1. Open **Settings → Payment Settings → Razorpay**.
2. Click **Open Razorpay** and copy the live Key ID and Key Secret.
3. Paste the Key ID and Key Secret into Miru.
4. Keep **Show Razorpay on INR invoices** enabled.
5. Click **Save Razorpay**.

## Add Webhooks

In Miru, use **Copy setup** from the Razorpay webhook box. It copies both endpoint URLs and the events to select.

Payment Links webhook:

```text
https://app.miru.so/webhooks/razorpay/payment_links
```

Select these events:

- `payment_link.paid`
- `payment_link.partially_paid`
- `payment_link.cancelled`
- `payment_link.expired`

RazorpayX payouts webhook:

```text
https://app.miru.so/webhooks/razorpay/payouts
```

Select these events:

- `payout.pending`
- `payout.queued`
- `payout.initiated`
- `payout.processed`
- `payout.updated`
- `payout.failed`
- `payout.rejected`
- `payout.reversed`
- `payout.cancelled`

Use the same webhook secret in Razorpay and Miru. The webhook secret is different from the API Key Secret.

## Confirm an Uncertain Connected-Account Link

If a connected-account request times out, Miru keeps the original reference and blocks another payment link. An empty lookup does not prove Razorpay rejected the first request.

An owner or administrator can open **Settings → Payment Settings → Razorpay**, find **Payment links need confirmation**, and click **Check Razorpay**. Check the account and test/live mode listed for that invoice. If you found the link in Razorpay, enter its `plink_` ID; Miru verifies it against the original invoice, reference, amount and currency before accepting it. This check does not create another link or resend SMS.

The background recovery job also checks uncertain links every five minutes while the original account remains connected. If a confirmed link belongs to an invoice that was closed or changed, Miru retains its references and queues cancellation. Captured money that cannot be applied appears separately under **Razorpay payments need your review**. An unresolved lookup remains blocked for investigation.

## Enable UPI Payouts

1. Activate RazorpayX and payout API access.
2. Add the RazorpayX account number in Miru.
3. Add the verified payout UPI ID.
4. Enable **UPI payouts**.
5. Keep **Queue low-balance payouts** enabled if RazorpayX should queue payouts when the source account balance is low.

## Verify

1. Create a test INR invoice.
2. Open the client payment link and pay through Razorpay test mode.
3. Confirm the invoice is marked paid after the webhook delivery.
4. If UPI payouts are enabled, confirm the payout row appears on the Payments page and moves to the final RazorpayX status after webhook delivery.
