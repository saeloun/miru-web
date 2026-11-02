# frozen_string_literal: true

require "digest"

module PaymentProviders
  class RazorpayOauthConnection
    class Error < StandardError; end

    def initialize(provider:, actor:, client: nil)
      @provider, @actor, @client = provider, actor, client
    end

    def start!
      identity = client.identity
      state = SecureRandom.hex(32)
      @provider.with_lock do
        authorize!
        reject_legacy!
        raise Error, "Disconnect the existing Razorpay account before reconnecting" if restart_blocked?

        invalidate!
        record_consent_attempt!(state, identity)
        @provider.save!
      end
      state
    rescue RazorpayOauthClient::Error
      raise Error, "Razorpay account connection is not configured", cause: nil
    end

    def complete!(state:, browser_state:, code: nil, error: nil)
      outcome, pending, identity = reserve_exchange(state, browser_state, code, error)
      return :denied if outcome == :denied
      raise Error, "Razorpay account connection failed" if outcome == :invalid

      exchange_grant(code, pending, identity)
    rescue RazorpayOauthClient::Error
      raise Error, "Razorpay account connection is not configured", cause: nil
    end

    def access_token
      attempt = {}
      token = locked_access_token(attempt)
      return token if token

      revoke_rejected_refresh!(attempt)
      raise Error, "Razorpay account connection failed", cause: nil
    rescue ActiveRecord::ActiveRecordError
      recover_interrupted_access!(attempt)
      raise Error, "Razorpay account connection failed", cause: nil
    end

    def disconnect!
      cleanup = disable_connection!
      confirmed, authorized = revoke_after_disconnect!(cleanup)
      raise Error, "Razorpay connection access denied" unless authorized

      { remote_revocation_confirmed: confirmed }
    end

    def status
      {
        status: connection_state,
        account_id: settings["oauth_account_id"], mode: settings["oauth_mode"],
        collections_ready: false, payouts_ready: false
      }
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def settings
        @provider.settings ||= {}
      end

      def restart_blocked?
        settings.key?("razorpay_oauth_credentials") || settings.key?("razorpay_oauth_credentials_ciphertext") ||
          settings["oauth_pending_digest"].present? || settings["oauth_refresh_uncertain"]
      end

      def record_consent_attempt!(state, identity)
        settings.merge!(
          "authentication_mode" => "oauth", "oauth_mode" => identity.fetch("mode"), "oauth_status" => "pending",
          "oauth_state" => {
            "digest" => digest(state), "actor_id" => @actor.id, "company_id" => @provider.company_id, "identity" => identity,
            "expires_at" => 10.minutes.from_now.to_i
          }
        )
      end

      def reserve_exchange(state, browser_state, code, error)
        @provider.with_lock do
          authorize!
          reject_legacy!
          stored = settings["oauth_state"]
          raise Error, "Invalid or expired Razorpay connection state" unless valid_state?(stored, state, browser_state)

          # Commit consumption before the external exchange; a failed response cannot be replayed.
          settings.delete("oauth_state")
          identity = matching_identity(stored)
          outcome = exchange_outcome(identity, code, error)
          pending = outcome == :exchange ? mark_exchange_pending!(stored) : fail_attempt!(error)
          @provider.save!
          [outcome, pending, identity]
        end
      end

      def matching_identity(stored)
        identity = client.identity
        identity if stored["identity"] == identity
      rescue RazorpayOauthClient::Error
        nil
      end

      def exchange_outcome(identity, code, error)
        return :invalid if identity.nil?
        return :denied if error.present?

        RazorpayOauthClient.usable_text?(code) ? :exchange : :invalid
      end

      def mark_exchange_pending!(stored)
        [stored.fetch("digest"), settings.fetch("oauth_generation")].tap do |digest, generation|
          settings.merge!("oauth_pending_digest" => digest, "oauth_pending_generation" => generation)
        end
      end

      def fail_attempt!(error)
        fail_closed!(error.present? ? "disconnected" : "reconnect_required")
        nil
      end

      def exchange_grant(code, pending, identity)
        result = client.exchange(code)
        finish_connection!(pending, result, identity)
      rescue RazorpayOauthClient::Error => error
        cleanup = error.__send__(:cleanup_grant)
        cleanup ? reject_grant!(pending, cleanup, identity) : fail_pending!(pending)
        raise Error, "Razorpay account connection failed", cause: nil
      end

      def locked_access_token(attempt)
        @provider.with_lock do
          unless oauth? && @provider.connected? && settings["oauth_status"] == "connected"
            raise Error, "Razorpay account connection failed"
          end
          attempt[:pending] = [settings["oauth_pending_digest"], settings["oauth_generation"]]

          begin
            current_access_token(attempt)
          rescue Error, RazorpayOauthClient::Error, KeyError, ActiveRecord::ActiveRecordError => error
            record_access_failure!(attempt, error)
            nil
          end
        end
      end

      def current_access_token(attempt)
        credentials = @provider.razorpay_oauth_credentials
        attempt[:identity] = client.identity
        raise Error, "Razorpay account connection failed" unless usable_credentials?(credentials, attempt[:identity])

        credentials = rotate_credentials!(credentials, attempt) if credentials["expires_at"].to_i <= 1.minute.from_now.to_i
        credentials.fetch("access_token")
      end

      def usable_credentials?(credentials, identity)
        credentials.is_a?(Hash) && credentials["identity"] == identity &&
          %w[access_token refresh_token].all? { |key| credentials[key].is_a?(String) && credentials[key].present? }
      end

      def rotate_credentials!(credentials, attempt)
        attempt[:refreshing] = true
        attempt[:result] = client.refresh(credentials.fetch("refresh_token"), account_id: settings["oauth_account_id"])
        raise Error, "Razorpay account connection failed" unless client.identity == attempt[:identity]

        @provider.class.transaction(requires_new: true) do
          store_credentials!(attempt[:result], attempt[:identity])
          @provider.save!
        end
        @provider.razorpay_oauth_credentials
      end

      def record_access_failure!(attempt, error)
        attempt[:result] ||= error.__send__(:cleanup_grant) if error.is_a?(RazorpayOauthClient::Error)
        @provider.reload
        returned_token = attempt[:result].is_a?(Hash) && attempt[:result]["refresh_token"].present?
        if returned_token
          @provider.razorpay_oauth_credentials = attempt[:result].slice("refresh_token").merge("identity" => attempt[:identity])
        elsif attempt[:refreshing]
          settings["oauth_refresh_uncertain"] = true
        end
        fail_closed!("reconnect_required")
        attempt[:cleanup] = @provider.razorpay_oauth_credentials if returned_token
        @provider.save!
      end

      def revoke_rejected_refresh!(attempt)
        return unless attempt[:cleanup]

        @provider.with_lock do
          revoke_cleanup!(attempt[:cleanup])
          @provider.save!
        end
      end

      def recover_interrupted_access!(attempt)
        if attempt[:result]
          reject_grant!(attempt[:pending], attempt[:result], attempt[:identity])
        elsif attempt[:pending]
          fail_pending!(attempt[:pending])
        end
      end

      def disable_connection!
        @provider.with_lock do
          authorize!
          reject_legacy!
          raise Error, "No Razorpay account connection to disconnect" unless oauth?

          invalidate!
          settings["oauth_status"] = "disconnected"
          @provider.razorpay_oauth_credentials.tap { @provider.save! }
        end
      end

      def revoke_after_disconnect!(cleanup)
        @provider.with_lock do
          # Keep the row locked until revocation ends so reconnect cannot race an old revocation.
          confirmed = revoke_cleanup!(cleanup)
          @provider.save!
          [confirmed, still_authorized?]
        end
      end

      def still_authorized?
        authorize!
        true
      rescue Error
        false
      end

      def connection_state
        state = settings.fetch("oauth_status", "disconnected")
        return "reconciliation_required" if settings["oauth_refresh_uncertain"] || (settings["oauth_pending_digest"].present? && state != "pending")
        return "revocation_pending" if !@provider.connected? && settings.key?("razorpay_oauth_credentials_ciphertext")

        state
      end

      def client
        @client ||= RazorpayOauthClient.new
      end

      def authorize!
        unless @provider.persisted? && @provider.razorpay? && @actor&.reload&.current_workspace_id == @provider.company_id &&
            RazorpayConnectionPolicy.new(@actor, @provider.company).manage?
          raise Error, "Razorpay connection access denied"
        end
      rescue ActiveRecord::RecordNotFound
        raise Error, "Razorpay connection access denied", cause: nil
      end

      def reject_legacy!
        if @provider.key_id.present? || settings.values_at("key_secret", "key_secret_ciphertext").any?(&:present?)
          raise Error, "Existing Razorpay API key connections cannot be replaced"
        end
      end

      def oauth?
        settings["authentication_mode"] == "oauth"
      end

      def digest(value)
        Digest::SHA256.hexdigest(value)
      end

      def valid_state?(stored, state, browser_state)
        stored.is_a?(Hash) && state.is_a?(String) && state.match?(/\A[0-9a-f]{64}\z/) &&
          browser_state.is_a?(String) && ActiveSupport::SecurityUtils.secure_compare(state, browser_state) &&
          stored["digest"].is_a?(String) && ActiveSupport::SecurityUtils.secure_compare(stored["digest"], digest(state)) &&
          stored["actor_id"] == @actor.id && stored["company_id"] == @provider.company_id && stored["expires_at"].to_i > Time.current.to_i
      end

      def invalidate!
        settings["oauth_generation"] = SecureRandom.hex(16)
        settings.delete("oauth_state")
        fail_closed!("disconnected")
      end

      def fail_closed!(status)
        @provider.connected = @provider.enabled = false
        @provider.enabled_on_invoices = @provider.payouts_enabled = false
        credentials = @provider.razorpay_oauth_credentials
        if credentials.is_a?(Hash) && credentials["refresh_token"].present?
          @provider.razorpay_oauth_credentials = credentials.slice("refresh_token", "identity")
        end
        settings["oauth_status"] = status
      end

      def clear_credentials!
        settings.delete("razorpay_oauth_credentials")
        settings.delete("razorpay_oauth_credentials_ciphertext")
      end

      def clear_exchange!(pending)
        if exchange_pending?(pending)
          settings.delete("oauth_pending_digest")
          settings.delete("oauth_pending_generation")
        end
      end

      def exchange_pending?(pending)
        pending == [settings["oauth_pending_digest"], settings["oauth_pending_generation"]]
      end

      def revoke_cleanup!(expected)
        credentials = @provider.razorpay_oauth_credentials
        return false unless credentials == expected && credentials.is_a?(Hash)

        confirmed = credentials.is_a?(Hash) && credentials["refresh_token"].present? &&
          credentials["identity"] == client.identity && client.revoke(credentials["refresh_token"]) == true
        clear_credentials! if confirmed
        settings["oauth_status"] = "revocation_pending" if settings.key?("razorpay_oauth_credentials_ciphertext")
        confirmed == true && !settings["oauth_refresh_uncertain"]
      rescue RazorpayOauthClient::Error
        settings["oauth_status"] = "revocation_pending"
        false
      end

      def pending?(pending)
        pending == [settings["oauth_pending_digest"], settings["oauth_generation"]]
      end

      def fail_pending!(pending)
        @provider.reload.with_lock do
          if pending?(pending)
            fail_closed!("reconnect_required")
            @provider.save!
          end
        end
      rescue ActiveRecord::ActiveRecordError
        raise Error, "Razorpay account connection failed", cause: nil
      end

      def finish_connection!(pending, result, identity)
        unless attach_grant!(pending, result, identity)
          reject_grant!(pending, result, identity)
          raise Error, "Razorpay account connection failed", cause: nil
        end

        :connected
      rescue ActiveRecord::ActiveRecordError
        reject_grant!(pending, result, identity)
        raise Error, "Razorpay account connection failed", cause: nil
      end

      def attach_grant!(pending, result, identity)
        @provider.with_lock do
          attached = begin
            raise Error, "Razorpay connection attempt was superseded" unless pending?(pending)

            authorize!
            reject_legacy!
            raise Error, "Razorpay account connection failed" unless client.identity == identity

            store_credentials!(result, identity)
            @provider.connected = true
            settings["oauth_status"] = "connected"
            clear_exchange!(pending)
            true
          rescue Error, RazorpayOauthClient::Error
            fail_closed!("reconnect_required")
            false
          end
          @provider.save!
          attached
        end
      end

      def reject_grant!(pending, result, identity)
        cleanup = nil
        @provider.reload.with_lock do
          unless exchange_pending?(pending) || pending?(pending)
            raise Error, "Razorpay account connection requires reconciliation"
          end

          @provider.razorpay_oauth_credentials = result.slice("refresh_token").merge("identity" => identity)
          fail_closed!("reconnect_required")
          clear_exchange!(pending)
          cleanup = @provider.razorpay_oauth_credentials
          @provider.save!
        end
        @provider.with_lock do
          revoke_cleanup!(cleanup)
          @provider.save!
        end
      rescue ActiveRecord::ActiveRecordError
        raise Error, "Razorpay account connection requires reconciliation", cause: nil
      end

      def store_credentials!(result, identity)
        account = result["razorpay_account_id"] if result.is_a?(Hash)
        expiry = result["expires_in"] if result.is_a?(Hash)
        previous_account = settings["oauth_account_id"]
        unless result.is_a?(Hash) && %w[access_token refresh_token public_token].all? { |key| result[key].is_a?(String) && result[key].present? } &&
            account.is_a?(String) && account.match?(/\Aacc_[A-Za-z0-9]{1,116}\z/) &&
            (previous_account.blank? || previous_account == account) && expiry.is_a?(Integer) && expiry.positive?
          raise Error, "Razorpay account connection failed"
        end

        @provider.razorpay_oauth_credentials = result.slice("access_token", "refresh_token", "public_token").merge(
          "identity" => identity, "expires_at" => Time.current.to_i + expiry)
        settings["oauth_account_id"] = account
        settings["oauth_mode"] = identity.fetch("mode")
      end
  end
end
