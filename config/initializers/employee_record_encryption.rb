# frozen_string_literal: true

# Missing keys deliberately fail closed; keep durable keys in env or Rails credentials.
unless Rails.env.test?
  keys = %i[primary_key deterministic_key key_derivation_salt].index_with do |key|
    ENV["ACTIVE_RECORD_ENCRYPTION_#{key.to_s.upcase}"].presence ||
      Rails.application.credentials.dig(:active_record_encryption, key)
  end
  ActiveRecord::Encryption.configure(**keys)
end
