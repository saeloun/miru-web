# frozen_string_literal: true

module PayrollProviders
  class LocalPreflight
    def self.call(**attributes)
      new(**attributes).call
    end

    def initialize(balance:, binding:, amounts:, review:, clock: -> { Time.now.utc })
      @balance = balance
      @expected = binding.slice(:provider, :company_id, :currency, :account_reference, :environment)
      @amounts = amounts.values_at(:total_minor_units, :fees_minor_units, :reserve_minor_units)
      @reviewed_revision_digest, @current_revision_digest = review.values_at(:reviewed_revision_digest, :current_revision_digest)
      @accounts_approved, @final_approved = review.values_at(:accounts_approved, :final_approved)
      @capabilities_verified, @recipients_verified = review.values_at(:capabilities_verified, :recipients_verified)
      @now = clock.call
    end

    def call
      blockers = []
      validate_binding(blockers)
      required = required_amount(blockers)
      available = available_amount(blockers)
      validate_timestamps(blockers)
      validate_review(blockers)
      blockers << "capabilities_unverified" unless @capabilities_verified == true
      blockers << "recipients_unverified" unless @recipients_verified == true
      blockers << "insufficient_balance" if required && available && available < required

      {
        status: blockers.empty? ? "ready_for_manual_review" : "blocked", blockers: blockers.freeze,
        required_minor_units: required, available_minor_units: available,
        currency: @expected[:currency].is_a?(String) ? @expected[:currency].dup.freeze : nil,
        revision_digest: @current_revision_digest.is_a?(String) ? @current_revision_digest.dup.freeze : nil
      }.freeze
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def validate_binding(blockers)
        unless @expected.length == 5 && @expected[:company_id].is_a?(Integer) && @expected[:company_id].positive? &&
            ["USD", "INR"].include?(@expected[:currency]) &&
            ["live", "sandbox"].include?(@expected[:environment]) &&
            { "mercury" => "USD", "razorpay" => "INR" }[@expected[:provider]] == @expected[:currency] &&
            digest?(@expected[:account_reference])
          blockers << "invalid_expected_binding"
        end
        unless @balance.is_a?(Hash) && @expected.all? { |key, value| @balance[key] == value }
          blockers << "balance_binding_mismatch"
        end
      end

      def required_amount(blockers)
        total, fees, reserve = @amounts
        if @amounts.all? { |amount| amount.is_a?(Integer) && amount >= 0 } && total.positive?
          total + fees + reserve
        else
          blockers << "invalid_required_amounts"
          nil
        end
      end

      def available_amount(blockers)
        amount = @balance[:available_minor_units] if @balance.is_a?(Hash)
        return amount if amount.is_a?(Integer) && amount >= 0

        blockers << "invalid_available_balance"
        nil
      end

      def validate_timestamps(blockers)
        fetched = @balance[:fetched_at] if @balance.is_a?(Hash)
        observed = @balance[:observed_at] if @balance.is_a?(Hash)
        unless recent?(fetched) && (observed.nil? || (recent?(observed) && observed <= fetched + 30)) &&
            (@expected[:provider] != "razorpay" || !observed.nil?)
          blockers << "balance_stale_or_invalid"
        end
      end

      def recent?(time)
        time.is_a?(Time) && @now.is_a?(Time) && time >= @now - 300 && time <= @now + 30
      end

      def validate_review(blockers)
        unless digest?(@reviewed_revision_digest) && digest?(@current_revision_digest) &&
            @reviewed_revision_digest == @current_revision_digest
          blockers << "revision_not_reviewed"
        end
        blockers << "accounts_approval_missing" unless @accounts_approved == true
        blockers << "final_approval_missing" unless @final_approved == true
      end

      def digest?(value)
        value.is_a?(String) && value.match?(/\A[0-9a-f]{64}\z/)
      end
  end
end
