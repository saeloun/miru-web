# frozen_string_literal: true

if Rails.env.production? && ENV["SECRET_KEY_BASE_DUMMY"] != "1"
  secret_key_base = ENV["SECRET_KEY_BASE"].to_s
  invalid_secret_key_base = secret_key_base.blank? ||
    secret_key_base.match?(/\A(?:dummy|DUMMY|changeme|change-me|placeholder)\z/)

  if invalid_secret_key_base
    raise "SECRET_KEY_BASE must be set to a stable production secret. Changing it invalidates all Rails sessions."
  end

  provider_credentials_secret = ENV["PROVIDER_CREDENTIALS_ENCRYPTION_SECRET"].to_s.strip
  if provider_credentials_secret.match?(/\A(?:dummy|changeme|change-me|placeholder)\z/i)
    raise "PROVIDER_CREDENTIALS_ENCRYPTION_SECRET must not be a placeholder. Preserve the existing credential encryption secret."
  end
end
