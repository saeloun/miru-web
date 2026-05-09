# Phone OTP delivery

Miru phone OTP login uses MSG91 OTP Widget first when these env vars are present:

- `MSG91_WIDGET_ID`
- `MSG91_TOKEN_AUTH`

`MSG91_AUTH_KEY` is supported as a fallback for server-side MSG91 calls, but the OTP Widget send/verify flow should use `MSG91_TOKEN_AUTH`.

The MSG91 widget must be configured in the MSG91 dashboard under OTP Widgets. Miru calls:

- `https://api.msg91.com/api/v5/widget/sendOtp`
- `https://api.msg91.com/api/v5/widget/verifyOtp`
- `https://api.msg91.com/api/v5/widget/verifyAccessToken`

Send and verify calls use `tokenAuth` in the JSON body and the configured widget id. Do not expose `MSG91_TOKEN_AUTH` or `MSG91_AUTH_KEY` to the browser or mobile app.

Use the same configured MSG91 OTP widget for both Miru mobile login and the web app Phone OTP tab. The browser and mobile clients never call MSG91 directly; they call Miru, and Miru sends and verifies OTPs through MSG91 server-side.

The MSG91 widget-level webhook is marked deprecated in the MSG91 dashboard and is not required for this login flow.

If MSG91 widget credentials are not configured, Miru falls back to the older delivery path.

Miru sends OTP through WhatsApp Cloud API when these env vars are present:

- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
- `WHATSAPP_CLOUD_API_VERSION` optional, defaults to `v22.0`
- `WHATSAPP_OTP_TEMPLATE_NAME` optional, defaults to `miru_login_otp`
- `WHATSAPP_OTP_TEMPLATE_LANGUAGE` optional, defaults to `en_US`

The WhatsApp template must be approved before production use. It should accept the OTP code as the first body parameter.

If WhatsApp env vars are not configured, Miru falls back to the generic webhook provider:

- `MIRU_MOBILE_OTP_SMS_URL`
- `MIRU_MOBILE_OTP_SMS_AUTH_TOKEN` optional bearer token

The same backend powers:

- mobile app phone OTP login: `/api/v1/mobile/otp/request` and `/api/v1/mobile/otp/verify`
- web app phone OTP login: `/api/v1/users/otp/request` and `/api/v1/users/otp/verify`
