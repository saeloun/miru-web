# frozen_string_literal: true

module Passkeys
  class ChallengeToken
    TTL = 10.minutes

    class InvalidTokenError < StandardError; end

    def self.issue(payload)
      verifier.generate(payload.merge("expires_at" => TTL.from_now.to_i))
    end

    def self.verify(token)
      payload = verifier.verify(token)
      raise InvalidTokenError if payload["expires_at"].to_i < Time.current.to_i

      payload
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      raise InvalidTokenError
    end

    def self.verifier
      secret = Rails.application.key_generator.generate_key("passkeys-challenge-token", 32)
      ActiveSupport::MessageVerifier.new(secret, serializer: JSON)
    end
  end
end
