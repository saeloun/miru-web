# frozen_string_literal: true

require "digest"

module PaymentProviders
  class RazorpayOauthConnection
    class Error < StandardError; end
    class RefreshInProgress < Error; end

    ACTIVE_MERCHANT_STATUSES = %w[activated instantly_activated payments_enabled].freeze
    REFRESH_RESERVATION_TTL = 60
    BLOCKING_MERCHANT_STATUSES = %w[suspended rejected under_review needs_clarification funds_hold].freeze
    ACCOUNT_ID = /\Aacc_[A-Za-z0-9]{1,116}\z/
    PROVIDER_REFERENCE = %r{\A[A-Za-z0-9][A-Za-z0-9._/#-]{3,63}\z}

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
      return outcome if %i[denied merchant_rejected].include?(outcome)
      raise Error, "Razorpay account connection failed" if outcome == :invalid

      exchange_grant(code, pending, identity)
    rescue RazorpayOauthClient::Error
      raise Error, "Razorpay account connection is not configured", cause: nil
    end

    def access_token
      attempt = {}
      reserve_refresh!(attempt)
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

    def update_collections!(enabled:)
      @provider.with_lock do
        authorize!
        reject_legacy!
        raise Error, "Razorpay invoice collection is not ready for this account" if enabled && !collections_ready?

        @provider.enabled = @provider.enabled_on_invoices = enabled
        @provider.save!
        audit!("razorpay_oauth_collections_changed", enabled:)
      end
    end

    def request_recovery!(account_id:)
      @provider.with_lock do
        authorize!
        reject_legacy!
        raise Error, "No Razorpay recovery is required" unless recovery_available?

        account = recovery_account(account_id)
        settings["oauth_recovery"] = { "account_id" => account, "requested_at" => Time.current.to_i, "requested_by" => @actor.id }
        @provider.save!
        audit!("razorpay_oauth_recovery_requested", account_id: account)
      end
    end

    def finish_recovery_with_evidence!(provider_reference:)
      @provider.with_lock do
        authorize!
        reject_legacy!
        raise Error, "Start Razorpay recovery first" unless connection_state == "recovery_pending"
        raise Error, "Retry disconnect so Razorpay can revoke the known grant first" if cleanup_pending? && !cleanup_from_other_application?
        raise Error, "Enter the Razorpay support reference" unless provider_reference.is_a?(String) && provider_reference.match?(PROVIDER_REFERENCE)

        audit!("razorpay_oauth_recovery_attested", account_id: settings.dig("oauth_recovery", "account_id"), provider_reference:,
          discarded_other_application_token: cleanup_pending?)
        clear_credentials!
        clear_reconciliation!
        fail_closed!("reconnect_required")
        @provider.save!
      end
    end

    def provider_revoked!(occurred_at:, event_id:)
      @provider.with_lock do
        next :ignored if occurred_at < revocation_floor

        in_flight = settings["oauth_status"] == "pending" && settings["oauth_pending_digest"].present?
        audit!("razorpay_oauth_provider_revoked", account_id: settings["oauth_account_id"], event_id:, occurred_at:)
        clear_credentials!
        clear_reconciliation! unless in_flight
        invalidate!
        settings["oauth_status"] = "revoked"
        @provider.save!
        :revoked
      end
    end

    def merchant_status_changed!(status, occurred_at:, event_id:)
      @provider.with_lock do
        next :ignored if occurred_at < settings["oauth_merchant_status_at"].to_i || (status == "funds_unhold" && settings["oauth_merchant_status"] != "funds_hold")

        status = record_merchant_status!(status, occurred_at)
        @provider.enabled = @provider.enabled_on_invoices = false if BLOCKING_MERCHANT_STATUSES.include?(status)
        @provider.save!
        audit!("razorpay_oauth_merchant_status", status:, event_id:, occurred_at:)
        :updated
      end
    end

    def collections_ready?
      collections_blocker.nil?
    end

    def collections_enabled?
      collections_ready? && @provider.enabled? && @provider.enabled_on_invoices?
    end

    def legacy?
      @provider.key_id.present? || settings.values_at("key_secret", "key_secret_ciphertext").any?(&:present?)
    end

    def status
      {
        status: legacy? ? "disconnected" : connection_state,
        account_id: settings["oauth_account_id"].presence || settings.dig("oauth_recovery", "account_id"), mode: settings["oauth_mode"],
        merchant_status: settings["oauth_merchant_status"], collections_enabled: collections_enabled?, collections_ready: collections_ready?,
        collections_blocker:, payouts_ready: false, recovery_available: recovery_available?, cleanup_pending: cleanup_pending?,
        payments_needing_review: @provider.persisted? ? RazorpayPaymentReview.pending_for(@provider.company) : [],
        links_needing_confirmation: @provider.persisted? ? RazorpayPaymentLinkCreation.pending_for(@provider.company) : []
      }
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def settings
        @provider.settings ||= {}
      end

      def collections_blocker
        return "not_connected" unless connection_state == "connected" && @provider.connected?
        return "collections_disabled" unless ENV["RAZORPAY_OAUTH_ENABLED"] == "true" && ENV["RAZORPAY_OAUTH_COLLECTIONS_ENABLED"] == "true"
        return "webhook_not_configured" if ENV["RAZORPAY_OAUTH_WEBHOOK_SECRET"].blank?
        return "application_changed" unless application_unchanged?

        merchant_blocker
      end

      def application_unchanged?
        identity = current_identity
        credentials = @provider.razorpay_oauth_credentials
        credentials.is_a?(Hash) && same_application?(credentials["identity"], identity)
      end

      def same_application?(stored, current)
        stored.is_a?(Hash) && current.is_a?(Hash) && stored.slice("client_id", "mode") == current.slice("client_id", "mode")
      end

      def current_identity
        client.identity
      rescue RazorpayOauthClient::Error
        nil
      end

      def cleanup_pending?
        settings.key?("razorpay_oauth_credentials_ciphertext") && !@provider.connected?
      end

      def cleanup_from_other_application?
        credentials = @provider.razorpay_oauth_credentials
        identity = current_identity
        identity.present? && (!credentials.is_a?(Hash) || !same_application?(credentials["identity"], identity))
      end

      def recovery_available?
        state = connection_state
        %w[reconciliation_required recovery_pending].include?(state) || (state == "revocation_pending" && cleanup_from_other_application?)
      end

      def record_merchant_status!(status, occurred_at)
        status = settings["oauth_merchant_status_before_hold"] if status == "funds_unhold"
        settings["oauth_merchant_status_before_hold"] = settings["oauth_merchant_status"] if status == "funds_hold"
        settings.merge!("oauth_merchant_status" => status, "oauth_merchant_status_at" => occurred_at)
        status
      end

      def merchant_blocker
        status = settings["oauth_merchant_status"]
        return if ACTIVE_MERCHANT_STATUSES.include?(status) || (status.nil? && settings["oauth_mode"] == "test")

        status.present? ? "merchant_#{status}" : "merchant_unconfirmed"
      end

      def recovery_account(account_id)
        known = settings["oauth_account_id"]
        return known if known.present? && [nil, "", known].include?(account_id)
        raise Error, "Use the Razorpay account that was connected to this workspace" if known.present?
        raise Error, "Enter the Razorpay account ID, which starts with acc_" unless account_id.is_a?(String) && account_id.match?(ACCOUNT_ID)

        account_id
      end

      def revocation_floor
        recovery_at = settings.dig("oauth_recovery", "requested_at").to_i
        uncertain_at = settings["oauth_refresh_uncertain_at"].to_i
        # Legacy uncertainty has no safe event boundary until the owner starts recovery.
        return Float::INFINITY if settings["oauth_refresh_uncertain"] && !uncertain_at.positive? && !recovery_at.positive?

        [recovery_at, uncertain_at, settings["oauth_connected_at"].to_i, settings["oauth_refresh_reserved_at"].to_i].max
      end

      def clear_reconciliation!
        %w[oauth_refresh_uncertain oauth_refresh_uncertain_at oauth_recovery oauth_pending_digest oauth_pending_generation].each { |key| settings.delete(key) }
      end

      def audit!(action, **changes)
        Audited::Audit.create!(auditable: @provider, associated: @provider.company, user: @actor, action:, audited_changes: changes.stringify_keys)
      end

      def restart_blocked?
        settings.key?("razorpay_oauth_credentials") || settings.key?("razorpay_oauth_credentials_ciphertext") ||
          settings["oauth_pending_digest"].present? || settings["oauth_refresh_reservation"].present? || settings["oauth_refresh_uncertain"]
      end

      def record_consent_attempt!(state, identity)
        %w[oauth_merchant_status oauth_merchant_status_at].each { |key| settings.delete(key) } if settings["oauth_mode"] != identity.fetch("mode")
        settings.merge!(
          "authentication_mode" => "oauth", "oauth_mode" => identity.fetch("mode"), "oauth_client_id" => identity.fetch("client_id"),
          "oauth_status" => "pending",
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
        return error == "merchant_rejected" ? :merchant_rejected : :denied if error.present?

        RazorpayOauthClient.usable_text?(code) ? :exchange : :invalid
      end

      def mark_exchange_pending!(stored)
        [stored.fetch("digest"), settings.fetch("oauth_generation")].tap do |digest, generation|
          settings.merge!("oauth_pending_digest" => digest, "oauth_pending_generation" => generation)
        end
      end

      def fail_attempt!(error)
        rejected = error == "merchant_rejected"
        fail_closed!(rejected ? "merchant_rejected" : (error.present? ? "disconnected" : "reconnect_required"))
        nil
      end

      def exchange_grant(code, pending, identity)
        result = client.exchange(code)
        finish_connection!(pending, result, identity)
      rescue RazorpayOauthClient::Rejected
        clear_rejected_exchange!(pending)
        raise Error, "Razorpay account connection failed", cause: nil
      rescue RazorpayOauthClient::Error => error
        cleanup = error.__send__(:cleanup_grant)
        cleanup ? reject_grant!(pending, cleanup, identity) : fail_pending!(pending)
        raise Error, "Razorpay account connection failed", cause: nil
      end

      def clear_rejected_exchange!(pending)
        @provider.reload.with_lock do
          if pending?(pending)
            fail_closed!("reconnect_required")
            clear_exchange!(pending)
            @provider.save!
          end
        end
      end

      def connection_usable?
        oauth? && @provider.connected? && settings["oauth_status"] == "connected"
      end

      def credentials_expiring?(credentials)
        credentials.is_a?(Hash) && credentials["expires_at"].to_i <= 1.minute.from_now.to_i
      end

      # Commits refresh intent before the call, so a worker that dies after Razorpay rotates the
      # token leaves evidence. A successful or classified refresh clears it under the row lock.
      def reserve_refresh!(attempt)
        caller_transaction = @provider.class.connection_pool.with_connection(&:transaction_open?)
        @provider.with_lock do
          next unless connection_usable? && application_unchanged? &&
              credentials_expiring?(@provider.razorpay_oauth_credentials) && settings["oauth_refresh_reservation"].blank?

          # A savepoint cannot preserve intent if the caller later rolls back.
          raise RefreshInProgress, "Refresh Razorpay before starting a transaction" if caller_transaction

          attempt[:reservation] = SecureRandom.hex(8)
          settings.merge!("oauth_refresh_reservation" => attempt[:reservation], "oauth_refresh_reserved_at" => Time.current.to_i)
          @provider.save!
        end
      end

      def verify_refresh_reservation!(attempt)
        reservation = settings["oauth_refresh_reservation"]
        return if reservation.present? && reservation == attempt[:reservation]
        raise RefreshInProgress, "Razorpay refresh must reserve its intent first" if reservation.blank?
        raise RefreshInProgress, "Razorpay account connection is refreshing" if settings["oauth_refresh_reserved_at"].to_i > REFRESH_RESERVATION_TTL.seconds.ago.to_i

        attempt[:refreshing] = true
        raise Error, "Razorpay account connection failed"
      end

      def clear_refresh_reservation!
        %w[oauth_refresh_reservation oauth_refresh_reserved_at].each { |key| settings.delete(key) }
      end

      def locked_access_token(attempt)
        @provider.with_lock do
          raise Error, "Razorpay account connection failed" unless connection_usable?
          raise Error, "Razorpay application configuration changed" unless application_unchanged? || !@provider.razorpay_oauth_credentials.is_a?(Hash)

          attempt[:pending] = [settings["oauth_pending_digest"], settings["oauth_generation"]]

          begin
            current_access_token(attempt)
          rescue RefreshInProgress
            raise
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

        credentials = rotate_credentials!(credentials, attempt) if credentials_expiring?(credentials)
        credentials.fetch("access_token")
      end

      def usable_credentials?(credentials, identity)
        credentials.is_a?(Hash) && same_application?(credentials["identity"], identity) &&
          %w[access_token refresh_token].all? { |key| credentials[key].is_a?(String) && credentials[key].present? }
      end

      def rotate_credentials!(credentials, attempt)
        verify_refresh_reservation!(attempt)
        attempt[:refreshing] = true
        attempt[:result] = client.refresh(credentials.fetch("refresh_token"), account_id: settings["oauth_account_id"])
        raise Error, "Razorpay account connection failed" unless same_application?(client.identity, attempt[:identity])

        @provider.class.transaction(requires_new: true) do
          store_credentials!(attempt[:result], attempt[:identity])
          clear_refresh_reservation!
          @provider.save!
        end
        @provider.razorpay_oauth_credentials
      end

      def record_access_failure!(attempt, error)
        attempt[:result] ||= error.__send__(:cleanup_grant) if error.is_a?(RazorpayOauthClient::Error)
        @provider.reload
        clear_refresh_reservation!
        returned_token = attempt[:result].is_a?(Hash) && attempt[:result]["refresh_token"].present?
        if returned_token
          @provider.razorpay_oauth_credentials = attempt[:result].slice("refresh_token").merge("identity" => attempt[:identity])
        elsif error.is_a?(RazorpayOauthClient::Rejected)
          clear_credentials! if error.token_invalid?
        elsif attempt[:refreshing]
          mark_refresh_uncertain!
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
        if settings["oauth_refresh_uncertain"] || (!@provider.connected? && settings["oauth_refresh_reservation"].present?) ||
            (settings["oauth_pending_digest"].present? && state != "pending")
          return settings["oauth_recovery"].present? ? "recovery_pending" : "reconciliation_required"
        end
        if !@provider.connected? && settings.key?("razorpay_oauth_credentials_ciphertext")
          return settings["oauth_recovery"].present? ? "recovery_pending" : "revocation_pending"
        end

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
        raise Error, "Existing Razorpay API key connections cannot be replaced" if legacy?
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
        mark_refresh_uncertain! if settings["oauth_refresh_reservation"].present?
        clear_refresh_reservation!
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
        clear_refresh_reservation!
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
          same_application?(credentials["identity"], client.identity) && client.revoke(credentials["refresh_token"]) == true
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
            settings.merge!("oauth_status" => "connected", "oauth_connected_at" => Time.current.to_i)
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
        cleanup = retain_returned_grant!(pending, result, identity)
        return revoke_orphaned_grant!(result, identity) unless cleanup

        @provider.with_lock do
          revoke_cleanup!(cleanup)
          @provider.save!
        end
      rescue ActiveRecord::ActiveRecordError
        raise Error, "Razorpay account connection requires reconciliation", cause: nil
      end

      def retain_returned_grant!(pending, result, identity)
        @provider.reload.with_lock do
          attempt_current = exchange_pending?(pending) || pending?(pending)
          next if !attempt_current && settings.key?("razorpay_oauth_credentials_ciphertext")

          settings.delete("oauth_state") unless attempt_current
          @provider.razorpay_oauth_credentials = result.slice("refresh_token").merge("identity" => identity)
          fail_closed!("reconnect_required")
          clear_exchange!(pending)
          @provider.razorpay_oauth_credentials.tap { @provider.save! }
        end
      end

      # A newer grant owns the encrypted slot, so this returned token cannot be stored beside it.
      def revoke_orphaned_grant!(result, identity)
        return if same_application?(client.identity, identity) && client.revoke(result["refresh_token"]) == true

        mark_unknown_grant!
      rescue RazorpayOauthClient::Error
        mark_unknown_grant!
      end

      def mark_unknown_grant!
        @provider.with_lock do
          mark_refresh_uncertain!
          @provider.save!
        end
      end

      def mark_refresh_uncertain!
        settings.merge!("oauth_refresh_uncertain" => true, "oauth_refresh_uncertain_at" => Time.current.to_i)
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
