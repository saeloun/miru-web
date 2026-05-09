# frozen_string_literal: true

module MobileOtp
  class ChallengeToken
    TTL = 10.minutes

    class InvalidTokenError < StandardError; end

    def self.issue(payload, code: nil)
      token_payload = payload.merge("expires_at" => TTL.from_now.to_i)
      token_payload["code_digest"] = digest(code) if code.present?

      verifier.generate(token_payload)
    end

    def self.verify(token)
      payload = verifier.verify(token)
      raise InvalidTokenError if payload["expires_at"].to_i < Time.current.to_i

      payload
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      raise InvalidTokenError
    end

    def self.valid_code?(payload, code)
      expected = payload["code_digest"].to_s
      return false if expected.blank?

      actual = digest(code)
      return false unless expected.bytesize == actual.bytesize

      ActiveSupport::SecurityUtils.secure_compare(expected, actual)
    end

    def self.digest(code)
      Digest::SHA256.hexdigest("#{code.to_s.gsub(/\D/, "")}:#{Rails.application.secret_key_base}")
    end

    def self.verifier
      secret = Rails.application.key_generator.generate_key("mobile-otp-challenge-token", 32)
      ActiveSupport::MessageVerifier.new(secret, serializer: JSON)
    end
  end
end
