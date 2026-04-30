# Mobile OTP WhatsApp delivery

Miru mobile customer login sends OTP through WhatsApp Cloud API when these env vars are present:

- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
- `WHATSAPP_CLOUD_API_VERSION` optional, defaults to `v22.0`
- `WHATSAPP_OTP_TEMPLATE_NAME` optional, defaults to `miru_login_otp`
- `WHATSAPP_OTP_TEMPLATE_LANGUAGE` optional, defaults to `en_US`

The WhatsApp template must be approved before production use. It should accept the OTP code as the first body parameter.

If WhatsApp env vars are not configured, Miru falls back to the generic webhook provider:

- `MIRU_MOBILE_OTP_SMS_URL`
- `MIRU_MOBILE_OTP_SMS_AUTH_TOKEN` optional bearer token

