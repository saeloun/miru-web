# frozen_string_literal: true

class NativeGoogleAuthRequest < ApplicationRecord
  LIFETIME = 10.minutes
  CODE_LIFETIME = 1.minute
  CALLBACK_URI = "miru-native-ios://auth/google"
  OUTCOMES = %w[signed_in needs_workspace additional_verification_required].freeze
  URL_SAFE = /\A[A-Za-z0-9_-]+\z/
  PKCE_VERIFIER = /\A[A-Za-z0-9._~-]{43,128}\z/

  class InvalidHandoff < StandardError; end

  belongs_to :user, optional: true
  belongs_to :company, optional: true
  belongs_to :invitation, optional: true

  validates :request_digest, :code_challenge, :client_state, :intent, :expires_at, presence: true
  validates :intent, inclusion: { in: %w[login signup] }
  validates :outcome, inclusion: { in: OUTCOMES }, allow_nil: true

  def self.issue!(intent:, code_challenge:, state:, invitation: nil)
    unless %w[login signup].include?(intent) && state.is_a?(String) &&
        state.length.between?(32, 128) && URL_SAFE.match?(state) &&
        code_challenge.is_a?(String) && code_challenge.length == 43 && URL_SAFE.match?(code_challenge)
      raise InvalidHandoff
    end

    token = SecureRandom.hex(32)
    record = create!(request_digest: digest(token), intent:, code_challenge:, client_state: state,
      invitation:, expires_at: LIFETIME.from_now)
    [record, token]
  end

  def self.find_request!(token)
    raise InvalidHandoff unless token.is_a?(String) && /\A[0-9a-f]{64}\z/.match?(token)

    find_by!(request_digest: digest(token))
  rescue ActiveRecord::RecordNotFound
    raise InvalidHandoff
  end

  def self.digest(value)
    Digest::SHA256.hexdigest(value)
  end

  def bind_browser!(binding)
    with_lock do
      assert_pending!
      raise InvalidHandoff if browser_digest.present?

      update!(browser_digest: self.class.digest(binding))
    end
  end

  def complete!(binding:)
    with_lock do
      assert_pending!
      assert_browser!(binding)
      account, selected_company, result = yield
      raise InvalidHandoff unless OUTCOMES.include?(result)
      raise InvalidHandoff unless account.token.is_a?(String) && account.token.present?

      code = SecureRandom.hex(32)
      update!(user: account, company: selected_company, outcome: result,
        auth_state_digest: self.class.digest(account.token), code_digest: self.class.digest(code),
        code_expires_at: [CODE_LIFETIME.from_now, expires_at].min)
      code
    end
  end

  def cancel!(binding:)
    with_lock do
      assert_pending!
      assert_browser!(binding)
      update!(cancelled_at: Time.current)
    end
  end

  def exchange!(code:, verifier:)
    unless code.is_a?(String) && /\A[0-9a-f]{64}\z/.match?(code) &&
        verifier.is_a?(String) && PKCE_VERIFIER.match?(verifier)
      raise InvalidHandoff
    end
    challenge = Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false)

    with_lock do
      unless cancelled_at.nil? && consumed_at.nil? && expires_at > Time.current &&
          code_expires_at.present? && code_expires_at > Time.current &&
          OUTCOMES.include?(outcome) && code_digest.present? &&
          ActiveSupport::SecurityUtils.secure_compare(code_challenge, challenge) &&
          ActiveSupport::SecurityUtils.secure_compare(code_digest, self.class.digest(code))
        raise InvalidHandoff
      end

      account = user
      raise InvalidHandoff unless account

      account.lock!
      unless account.active_for_authentication? && account.confirmed? &&
          account.token.is_a?(String) && account.token.present? &&
          ActiveSupport::SecurityUtils.secure_compare(auth_state_digest, self.class.digest(account.token))
        raise InvalidHandoff
      end
      result = yield(account)
      update!(consumed_at: Time.current)
      result
    end
  end

  private

    def assert_pending!
      raise InvalidHandoff unless expires_at > Time.current && cancelled_at.nil? &&
        consumed_at.nil? && outcome.nil?
    end

    def assert_browser!(binding)
      unless binding.is_a?(String) && browser_digest.present? &&
          ActiveSupport::SecurityUtils.secure_compare(browser_digest, self.class.digest(binding))
        raise InvalidHandoff
      end
    end
end
