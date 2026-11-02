# frozen_string_literal: true

Rails.application.config.session_store :cookie_store,
  key: "_miru_web_session",
  expire_after: 20.years,
  same_site: :lax,
  secure: Rails.env.production?,
  httponly: true
