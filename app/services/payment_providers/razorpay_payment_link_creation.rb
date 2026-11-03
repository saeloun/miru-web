# frozen_string_literal: true

module PaymentProviders
  # A committed intent outlives a lost HTTP response. Only its creator may POST; recovery only reads.
  class RazorpayPaymentLinkCreation
    KEY = "razorpay_link_creation"
    RECHECK_INTERVAL = 15.seconds
    LINK_ID = /\Aplink_[A-Za-z0-9_]{1,80}\z/

    attr_reader :created

    def self.pending?(invoice)
      (invoice.payment_infos || {}).key?(KEY)
    end

    def self.pending_for(company)
      company.invoices.where("payment_infos -> '#{KEY}' IS NOT NULL").order(:id).limit(20).map do |invoice|
        intent = invoice.payment_infos[KEY]
        { invoice_id: invoice.id, invoice_number: invoice.invoice_number,
          reference_id: intent.is_a?(Hash) ? intent["reference_id"] : nil,
          account_id: intent.is_a?(Hash) ? intent["account_id"] : nil, mode: intent.is_a?(Hash) ? intent["mode"] : nil }
      end
    end

    def initialize(invoice:, provider:, client: nil)
      @invoice = invoice
      @provider = provider
      @client = client || RazorpayClient.new(provider:)
      @created = false
      @owns_intent = false
    end

    def process(&payload_builder)
      prepare!
      payload = reserve_or_find!(&payload_builder)
      return unless @intent
      unless @owns_intent
        link = recover!
        return if !link && !self.class.pending?(@invoice.reload) && @invoice.razorpay_payment_link_id.present?
        raise RazorpayPaymentLinkService::PaymentConfirming, "Razorpay payment link creation needs confirmation" unless link

        return link
      end

      response = @client.create_payment_link(payload, expected_context: context(@intent))
      link = attach!(response, @intent)
      @created = link.present?
      link
    rescue RazorpayClient::NotSent, RazorpayClient::CreationRejected
      clear_rejected_intent! if @owns_intent
      raise
    rescue RazorpayClient::Error
      raise RazorpayPaymentLinkService::PaymentConfirming, "Razorpay payment link creation needs confirmation", cause: nil
    end

    def recover!(payment_link_id: nil)
      prepare!
      intent = recovery_intent(payment_link_id)
      return unless intent

      candidate_id = payment_link_id.presence || locate_link(intent)
      return unless candidate_id
      raise RazorpayClient::Error, "Enter a Payment Link ID beginning with plink_" unless valid_link_id?(candidate_id)

      ensure_context!(intent)
      link = @client.fetch_payment_link(candidate_id, expected_context: context(intent))
      raise RazorpayClient::Error, "Razorpay returned a different payment link" unless link["id"] == candidate_id

      attach!(link, intent)
    rescue RazorpayClient::Error
      raise RazorpayClient::Error, "Razorpay link confirmation is still pending. Check the original account, mode and reference.", cause: nil
    end

    private

      def recovery_intent(payment_link_id)
        @invoice.with_lock do
          next unless self.class.pending?(@invoice)

          current = stored_intent
          ensure_context!(current)
          next if payment_link_id.blank? && current["checked_at"].to_i > RECHECK_INTERVAL.ago.to_i

          write_intent(current.merge("checked_at" => Time.current.to_i))
          current
        end
      end

      def reserve_or_find!
        payload = nil
        @intent = @invoice.with_lock do
          next if @invoice.razorpay_payment_link_id.present? && !self.class.pending?(@invoice)
          next stored_intent if self.class.pending?(@invoice)

          ensure_payable!
          payload = yield "miru-#{SecureRandom.uuid.delete('-')}"
          @owns_intent = true
          reserve!(payload)
        end
        payload
      end

      def locate_link(intent)
        links = @client.find_payment_links(intent.fetch("reference_id"), expected_context: context(intent))
        raise RazorpayClient::Error, "Razorpay returned an invalid payment link lookup" unless links.is_a?(Array)
        return if links.empty?
        raise RazorpayClient::Error, "Razorpay returned multiple links for this reference" unless links.one?

        candidate = links.first
        raise RazorpayClient::Error, "Razorpay returned an invalid payment link" unless candidate.is_a?(Hash) && valid_link_id?(candidate["id"])

        candidate.fetch("id")
      end

      def prepare!
        if @invoice.class.connection_pool.with_connection(&:transaction_open?)
          raise RazorpayClient::NotSent, "Razorpay link creation must start outside a transaction"
        end
        unless @provider&.persisted? && @provider.company_id == @invoice.company_id && @provider.razorpay_oauth?
          raise RazorpayClient::NotSent, "Reconnect the original Razorpay account to confirm this link"
        end

        @client.prepare_oauth!
      end

      def ensure_payable!
        if RazorpayPaymentReview.closed_reason(@invoice) || RazorpayPaymentReview.pending?(@invoice)
          raise RazorpayClient::NotSent, "This invoice is not available for another payment"
        end
        unless @provider.enabled? && @provider.enabled_on_invoices? && @provider.razorpay_oauth_collections_ready? && @invoice.currency == "INR" && @invoice.amount_due.to_d >= 1
          raise RazorpayClient::NotSent, "Razorpay collection requires an enabled INR invoice of at least INR 1"
        end
      end

      def reserve!(payload)
        intent = {
          "reference_id" => payload.fetch(:reference_id), "account_id" => @provider.settings.fetch("oauth_account_id"),
          "mode" => @provider.settings.fetch("oauth_mode"), "client_id" => @provider.settings.fetch("oauth_client_id"),
          "amount" => payload.fetch(:amount), "currency" => payload.fetch(:currency),
          "sms" => payload.dig(:notify, :sms), "state" => "sent", "started_at" => Time.current.to_i
        }
        write_intent(intent)
        audit!("razorpay_payment_link_creation_started", intent.slice("reference_id", "account_id", "mode", "amount", "currency"))
        intent
      end

      def stored_intent
        intent = (@invoice.payment_infos || {})[KEY]
        unless intent.is_a?(Hash) && intent["reference_id"].is_a?(String) && intent["reference_id"].match?(/\Amiru-[a-f0-9]{32}\z/)
          raise RazorpayClient::Error, "Razorpay link creation evidence needs administrator review"
        end

        intent.deep_dup
      end

      def ensure_context!(intent)
        @provider.reload
        expected = intent.values_at("account_id", "mode", "client_id")
        current = @provider.settings.values_at("oauth_account_id", "oauth_mode", "oauth_client_id")
        unless @provider.razorpay_oauth? && @provider.connected? && expected.all?(&:present?) && expected == current
          raise RazorpayClient::Error, "Reconnect the original Razorpay account to confirm this link"
        end
      end

      def context(intent)
        intent.slice("account_id", "mode", "client_id")
      end

      def attach!(link, intent)
        unless matches_intent?(link, intent)
          raise RazorpayClient::Error, "Razorpay did not return the payment link requested for this invoice"
        end

        attached = @invoice.with_lock do
          next unless self.class.pending?(@invoice) && stored_intent["reference_id"] == intent["reference_id"]
          if @invoice.razorpay_payment_link_id.present? && @invoice.razorpay_payment_link_id != link["id"]
            raise RazorpayClient::Error, "Another Razorpay link is already bound to this invoice"
          end

          infos = (@invoice.payment_infos || {}).merge(
            "razorpay_payment_link_id" => link.fetch("id"), "razorpay_payment_link_url" => link.fetch("short_url"),
            "razorpay_payment_link_status" => link.fetch("status"), "razorpay_payment_link_account_id" => intent.fetch("account_id"),
            "razorpay_payment_link_mode" => intent.fetch("mode"),
            "razorpay_payment_link_amount" => intent.fetch("amount"), "razorpay_payment_link_currency" => intent.fetch("currency"),
            "razorpay_payment_link_reference_id" => intent.fetch("reference_id"))
          @invoice.update_columns(payment_infos: infos, updated_at: Time.current)
          audit!("razorpay_payment_link_creation_confirmed", intent.slice("reference_id", "account_id", "mode").merge("payment_link_id" => link["id"]))
          link
        end
        reconcile_capture(link) if attached
        finish_confirmation!(link, intent) if attached
        @invoice.enqueue_razorpay_link_cancellation if attached
        attached
      end

      def finish_confirmation!(link, intent)
        @invoice.with_lock do
          next unless self.class.pending?(@invoice) && stored_intent["reference_id"] == intent["reference_id"] &&
            @invoice.razorpay_payment_link_id == link["id"]

          @invoice.update_columns(payment_infos: @invoice.payment_infos.except(KEY), updated_at: Time.current)
        end
      end

      def reconcile_capture(link)
        verification = RazorpayPaymentLinkVerification.new(invoice: @invoice, payment_link: link, account_id: @invoice.razorpay_payment_link_account_id)
        return unless %w[paid partially_paid].include?(link["status"]) || verification.captured_payments.any?

        payment_id = verification.captured_payment_id
        fulfilled = verification.fully_paid? && payment_id && InvoicePayment::RazorpayPaymentLinkFulfillment.process(invoice: @invoice, params: {
          razorpay_payment_link_id: link["id"], razorpay_payment_link_status: "paid", razorpay_payment_id: payment_id
        })
        unless fulfilled
          reason = RazorpayPaymentReview.closed_reason(@invoice) || (link["status"] == "partially_paid" ? "partial_payment" : "untracked_link")
          RazorpayPaymentReview.flag_link_captures!(@invoice, link, reason:)
        end
      end

      def matches_intent?(link, intent)
        notes = link["notes"] if link.is_a?(Hash)
        link.is_a?(Hash) && valid_link_id?(link["id"]) && link["reference_id"] == intent["reference_id"] &&
          link["amount"] == intent["amount"] && link["currency"] == intent["currency"] &&
          notes.is_a?(Hash) && notes["miru_invoice_id"] == @invoice.id.to_s && notes["company_id"] == @invoice.company_id.to_s &&
          %w[created partially_paid paid expired cancelled].include?(link["status"]) && valid_url?(link["short_url"])
      end

      def valid_link_id?(id)
        id.is_a?(String) && id.match?(LINK_ID)
      end

      def valid_url?(url)
        return false unless url.is_a?(String)

        uri = URI.parse(url)
        uri.is_a?(URI::HTTPS) && uri.host.present? && uri.userinfo.nil? && uri.port == 443
      rescue URI::InvalidURIError
        false
      end

      def clear_rejected_intent!
        @invoice.with_lock do
          next unless self.class.pending?(@invoice) && stored_intent["reference_id"] == @intent&.dig("reference_id")

          @invoice.update_columns(payment_infos: @invoice.payment_infos.except(KEY), updated_at: Time.current)
          audit!("razorpay_payment_link_creation_rejected", @intent.slice("reference_id", "account_id", "mode"))
        end
      end

      def write_intent(intent)
        @invoice.update_columns(payment_infos: (@invoice.payment_infos || {}).merge(KEY => intent), updated_at: Time.current)
      end

      def audit!(action, changes)
        Audited::Audit.create!(auditable: @invoice, associated: @invoice.company, action:, audited_changes: changes)
      end
  end
end
