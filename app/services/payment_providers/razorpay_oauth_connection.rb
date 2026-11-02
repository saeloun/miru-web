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
        if @provider.settings.key?("razorpay_oauth_credentials") || @provider.settings.key?("razorpay_oauth_credentials_ciphertext") ||
            @provider.settings["oauth_pending_digest"].present? || @provider.settings["oauth_refresh_uncertain"]
          raise Error, "Disconnect the existing Razorpay account before reconnecting"
        end

        invalidate!
        @provider.settings["authentication_mode"] = "oauth"
        @provider.settings["oauth_mode"] = identity.fetch("mode")
        @provider.settings["oauth_status"] = "pending"
        @provider.settings["oauth_state"] = {
          "digest" => digest(state), "actor_id" => @actor.id, "company_id" => @provider.company_id, "identity" => identity,
          "expires_at" => 10.minutes.from_now.to_i
        }
        @provider.save!
      end
      state
    rescue RazorpayOauthClient::Error
      raise Error, "Razorpay account connection is not configured", cause: nil
    end

    def complete!(state:, browser_state:, code: nil, error: nil)
      identity = nil
      pending = nil
      outcome = @provider.with_lock do
        authorize!
        reject_legacy!
        stored = @provider.settings["oauth_state"]
        unless valid_state?(stored, state, browser_state)
          raise Error, "Invalid or expired Razorpay connection state"
        end

        # Commit consumption before the external exchange; a failed response cannot be replayed.
        @provider.settings.delete("oauth_state")
        begin
          identity = client.identity
          configured = stored["identity"] == identity
        rescue RazorpayOauthClient::Error
          configured = false
        end
        if !configured || error.present? || !RazorpayOauthClient.usable_text?(code)
          fail_closed!(error.present? ? "disconnected" : "reconnect_required")
          @provider.save!
          configured && error.present? ? :denied : :invalid
        else
          pending = [stored.fetch("digest"), @provider.settings.fetch("oauth_generation")]
          @provider.settings["oauth_pending_digest"] = pending.first
          @provider.settings["oauth_pending_generation"] = pending.last
          @provider.save!
          :exchange
        end
      end
      return :denied if outcome == :denied
      raise Error, "Razorpay account connection failed" if outcome == :invalid

      begin
        result = client.exchange(code)
      rescue RazorpayOauthClient::Error => error
        cleanup = error.__send__(:cleanup_grant)
        if cleanup
          reject_grant!(pending, cleanup, identity)
        else
          fail_pending!(pending)
        end
        raise Error, "Razorpay account connection failed", cause: nil
      end
      finish_connection!(pending, result, identity)
    rescue RazorpayOauthClient::Error
      raise Error, "Razorpay account connection is not configured", cause: nil
    end

    def access_token
      token = nil
      failure = false
      pending = nil
      result = identity = nil
      refreshing = false
      cleanup = nil
      @provider.with_lock do
        unless oauth? && @provider.connected? && @provider.settings["oauth_status"] == "connected"
          raise Error, "Razorpay account connection failed"
        end
        pending = [@provider.settings["oauth_pending_digest"], @provider.settings["oauth_generation"]]

        begin
          credentials = @provider.razorpay_oauth_credentials
          identity = client.identity
          unless credentials.is_a?(Hash) && credentials["identity"] == identity &&
              credentials["access_token"].is_a?(String) && credentials["access_token"].present? &&
              credentials["refresh_token"].is_a?(String) && credentials["refresh_token"].present?
            raise Error, "Razorpay account connection failed"
          end

          if credentials["expires_at"].to_i <= 1.minute.from_now.to_i
            refreshing = true
            result = client.refresh(credentials.fetch("refresh_token"), account_id: @provider.settings["oauth_account_id"])
            raise Error, "Razorpay account connection failed" unless client.identity == identity

            @provider.class.transaction(requires_new: true) do
              store_credentials!(result, identity)
              @provider.save!
            end
            credentials = @provider.razorpay_oauth_credentials
          end
          token = credentials.fetch("access_token")
        rescue Error, RazorpayOauthClient::Error, KeyError, ActiveRecord::ActiveRecordError => error
          result ||= error.__send__(:cleanup_grant) if error.is_a?(RazorpayOauthClient::Error)
          @provider.reload
          if result.is_a?(Hash) && result["refresh_token"].present?
            @provider.razorpay_oauth_credentials = result.slice("refresh_token").merge("identity" => identity)
          elsif refreshing
            @provider.settings["oauth_refresh_uncertain"] = true
          end
          fail_closed!("reconnect_required")
          cleanup = @provider.razorpay_oauth_credentials if result.is_a?(Hash) && result["refresh_token"].present?
          @provider.save!
          failure = true
        end
      end
      if failure
        if cleanup
          @provider.with_lock do
            revoke_cleanup!(cleanup)
            @provider.save!
          end
        end
        raise Error, "Razorpay account connection failed", cause: nil
      end

      token
    rescue ActiveRecord::ActiveRecordError
      if result
        reject_grant!(pending, result, identity)
      elsif pending
        fail_pending!(pending)
      end
      raise Error, "Razorpay account connection failed", cause: nil
    end

    def disconnect!
      confirmed = false
      authorization_lost = false
      cleanup = nil
      @provider.with_lock do
        authorize!
        reject_legacy!
        raise Error, "No Razorpay account connection to disconnect" unless oauth?

        invalidate!
        @provider.settings["oauth_status"] = "disconnected"
        cleanup = @provider.razorpay_oauth_credentials
        @provider.save!
      end
      @provider.with_lock do
        # Keep the row locked until revocation ends so reconnect cannot race an old revocation.
        confirmed = revoke_cleanup!(cleanup)
        @provider.save!
        begin
          authorize!
        rescue Error
          authorization_lost = true
        end
      end
      raise Error, "Razorpay connection access denied" if authorization_lost

      { remote_revocation_confirmed: confirmed }
    end

    def status
      state = @provider.settings&.fetch("oauth_status", "disconnected") || "disconnected"
      if @provider.settings&.dig("oauth_refresh_uncertain") || (@provider.settings&.dig("oauth_pending_digest").present? && state != "pending")
        state = "reconciliation_required"
      elsif !@provider.connected? && @provider.settings&.key?("razorpay_oauth_credentials_ciphertext")
        state = "revocation_pending"
      end
      {
        status: state,
        account_id: @provider.settings&.dig("oauth_account_id"), mode: @provider.settings&.dig("oauth_mode"),
        collections_ready: false, payouts_ready: false
      }
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

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
        if @provider.key_id.present? || @provider.settings.values_at("key_secret", "key_secret_ciphertext").any?(&:present?)
          raise Error, "Existing Razorpay API key connections cannot be replaced"
        end
      end

      def oauth?
        @provider.settings["authentication_mode"] == "oauth"
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
        @provider.settings["oauth_generation"] = SecureRandom.hex(16)
        @provider.settings.delete("oauth_state")
        fail_closed!("disconnected")
      end

      def fail_closed!(status)
        @provider.connected = @provider.enabled = false
        @provider.enabled_on_invoices = @provider.payouts_enabled = false
        credentials = @provider.razorpay_oauth_credentials
        if credentials.is_a?(Hash) && credentials["refresh_token"].present?
          @provider.razorpay_oauth_credentials = credentials.slice("refresh_token", "identity")
        end
        @provider.settings["oauth_status"] = status
      end

      def clear_credentials!
        @provider.settings.delete("razorpay_oauth_credentials")
        @provider.settings.delete("razorpay_oauth_credentials_ciphertext")
      end

      def clear_exchange!(pending)
        if exchange_pending?(pending)
          @provider.settings.delete("oauth_pending_digest")
          @provider.settings.delete("oauth_pending_generation")
        end
      end

      def exchange_pending?(pending)
        pending == [@provider.settings["oauth_pending_digest"], @provider.settings["oauth_pending_generation"]]
      end

      def revoke_cleanup!(expected)
        credentials = @provider.razorpay_oauth_credentials
        return false unless credentials == expected && credentials.is_a?(Hash)

        confirmed = credentials.is_a?(Hash) && credentials["refresh_token"].present? &&
          credentials["identity"] == client.identity && client.revoke(credentials["refresh_token"]) == true
        clear_credentials! if confirmed
        @provider.settings["oauth_status"] = "revocation_pending" if @provider.settings.key?("razorpay_oauth_credentials_ciphertext")
        confirmed == true && !@provider.settings["oauth_refresh_uncertain"]
      rescue RazorpayOauthClient::Error
        @provider.settings["oauth_status"] = "revocation_pending"
        false
      end

      def pending?(pending)
        pending == [@provider.settings["oauth_pending_digest"], @provider.settings["oauth_generation"]]
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
        failure = false
        @provider.with_lock do
          begin
            raise Error, "Razorpay connection attempt was superseded" unless pending?(pending)

            authorize!
            reject_legacy!
            raise Error, "Razorpay account connection failed" unless client.identity == identity

            store_credentials!(result, identity)
            @provider.connected = true
            @provider.settings["oauth_status"] = "connected"
            clear_exchange!(pending)
          rescue Error, RazorpayOauthClient::Error
            fail_closed!("reconnect_required")
            failure = true
          end
          @provider.save!
        end
        if failure
          reject_grant!(pending, result, identity)
          raise Error, "Razorpay account connection failed", cause: nil
        end

        :connected
      rescue ActiveRecord::ActiveRecordError
        reject_grant!(pending, result, identity)
        raise Error, "Razorpay account connection failed", cause: nil
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
        previous_account = @provider.settings["oauth_account_id"]
        unless result.is_a?(Hash) && %w[access_token refresh_token public_token].all? { |key| result[key].is_a?(String) && result[key].present? } &&
            account.is_a?(String) && account.match?(/\Aacc_[A-Za-z0-9]{1,116}\z/) &&
            (previous_account.blank? || previous_account == account) && expiry.is_a?(Integer) && expiry.positive?
          raise Error, "Razorpay account connection failed"
        end

        @provider.razorpay_oauth_credentials = result.slice("access_token", "refresh_token", "public_token").merge(
          "identity" => identity, "expires_at" => Time.current.to_i + expiry)
        @provider.settings["oauth_account_id"] = account
        @provider.settings["oauth_mode"] = identity.fetch("mode")
      end
  end
end
