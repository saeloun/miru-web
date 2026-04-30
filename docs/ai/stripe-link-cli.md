# Stripe Link CLI Agent Payments

Miru subscription checkout is compatible with Stripe Link CLI for agent-led signup and upgrade flows.

Link CLI lets an agent request a one-time virtual card credential from the user's Link wallet. The user approves the spend request in Link, then the agent uses the approved virtual card details to complete Miru's normal Stripe Checkout page. Miru never receives or stores the Link CLI card credential.

## Agent Flow

1. Create or sign in to a Miru user.
2. Create or select the workspace.
3. Request checkout metadata:

```bash
curl -X POST "$MIRU_URL/api/v1/subscription/checkout" \
  -H "Authorization: Bearer $MIRU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interval":"monthly","agent_payment":"stripe_link_cli"}'
```

4. Read `agent_payment_options.stripe_link_cli` from the response.
5. Authenticate Link CLI and list payment methods:

```bash
link-cli auth login --client-name "Miru agent" --format json
link-cli payment-methods list --format json
```

6. Run the returned `commands.create_spend_request`, replacing `<payment_method_id>`.
7. After user approval, retrieve the approved virtual card:

```bash
link-cli spend-request retrieve <spend_request_id> --include=card --format json
```

8. Open the returned `url` and enter the approved card details in Stripe Checkout.

For local testing, append `--test` to the returned spend request command.

## Signup Discovery

The JSON signup response includes:

```json
{
  "agent_payment_options": {
    "stripe_link_cli": {
      "checkout_endpoint": "/api/v1/subscription/checkout",
      "checkout_request": {
        "method": "POST",
        "body": {
          "agent_payment": "stripe_link_cli",
          "interval": "monthly"
        }
      }
    }
  }
}
```

Agents should treat this as a discovery hint. Checkout still requires an authenticated workspace.
