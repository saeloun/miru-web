# frozen_string_literal: true

module PaymentProviders
  class RazorpayPaymentLinkService
    attr_reader :invoice, :provider, :callback_url

    def initialize(invoice:, provider:, callback_url:, notify_sms: false)
      @invoice = invoice
      @provider = provider
      @callback_url = callback_url
      @notify_sms = notify_sms
      @sms_sent = false
    end

    def process
      return create_or_reuse_link unless provider.razorpay_oauth?

      # Raised after the lock so a settlement or review recorded inside it is committed.
      invoice.with_lock { create_or_reuse_link }.tap do
        raise PaymentProviders::RazorpayClient::Error, @paid_link_outcome if @paid_link_outcome
      end
    end

    def sms_sent?
      @sms_sent
    end

    private

      def create_or_reuse_link
        return existing_payment_link if existing_payment_link?

        response = create_payment_link_with_fallback
        invoice.update!({
          razorpay_payment_link_id: response.fetch("id"),
          razorpay_payment_link_url: response.fetch("short_url"),
          razorpay_payment_link_status: response["status"].presence || "created",
          razorpay_payment_link_account_id: oauth_account_id
        }.compact)
        @sms_sent = notify_sms?

        response.fetch("short_url")
      end

      def existing_payment_link?
        raise PaymentProviders::RazorpayClient::Error, "Razorpay payment needs review" if invoice.razorpay_payment_review.present?

        invoice.razorpay_payment_link_id.present? && invoice.razorpay_payment_link_url.present?
      end

      def existing_payment_link
        payment_link = client.fetch_payment_link(invoice.razorpay_payment_link_id)
        prepare_oauth_link(payment_link) if provider.razorpay_oauth?
        return if @paid_link_outcome

        if payment_link["status"].in?(["created", "partially_paid"])
          invoice.update!(razorpay_payment_link_status: payment_link["status"]) if invoice.razorpay_payment_link_status != payment_link["status"]
          notify_existing_payment_link if notify_sms?
          return invoice.razorpay_payment_link_url
        end

        invoice.update!(
          razorpay_payment_link_id: nil,
          razorpay_payment_link_url: nil,
          razorpay_payment_link_status: payment_link["status"]
        )
        create_or_reuse_link
      rescue PaymentProviders::RazorpayClient::Error
        raise if provider.razorpay_oauth?

        invoice.razorpay_payment_link_url
      end

      def prepare_oauth_link(payment_link)
        verification = PaymentProviders::RazorpayPaymentLinkVerification.new(invoice:, payment_link:, account_id: oauth_account_id)
        reconcile_paid_link(payment_link, verification) if payment_link["status"] == "paid"
        return if payment_link["status"] != "created" || verification.reusable?

        client.cancel_payment_link(invoice.razorpay_payment_link_id)
        payment_link["status"] = "cancelled"
      end

      def reconcile_paid_link(payment_link, verification)
        payment_id = verification.captured_payment_id
        if verification.fully_paid? && payment_id.present?
          InvoicePayment::RazorpayPaymentLinkFulfillment.process(invoice:, params: {
            razorpay_payment_link_id: payment_link["id"], razorpay_payment_link_status: "paid", razorpay_payment_id: payment_id
          })
        else
          PaymentProviders::RazorpayPaymentReview.flag!(invoice, payment_id:, payment_link_id: payment_link["id"], amount: payment_link["amount"], reason: "paid_link_mismatch")
        end
        @paid_link_outcome = "Razorpay payment is being confirmed"
      end

      def oauth_account_id
        provider.settings["oauth_account_id"] if provider.razorpay_oauth?
      end

      def payment_link_payload
        {
          amount: amount_subunits,
          currency: invoice.currency,
          accept_partial: false,
          description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
          reference_id: reference_id,
          customer: customer_payload,
          notify: { sms: notify_sms?, email: false },
          reminder_enable: true,
          callback_url:,
          callback_method: "get",
          notes: notes_payload
        }.tap do |payload|
          route_options = route_transfer_options
          payload[:options] = route_options if route_options.present?
        end
      end

      def minimal_payment_link_payload
        {
          amount: amount_subunits,
          currency: invoice.currency,
          accept_partial: false,
          description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
          customer: customer_payload,
          notify: { sms: false, email: false },
          callback_url:,
          callback_method: "get"
        }.tap do |payload|
          route_options = route_transfer_options
          payload[:options] = route_options if route_options.present?
        end
      end

      def create_payment_link_with_fallback
        client.create_payment_link(payment_link_payload)
      rescue PaymentProviders::RazorpayClient::Error => error
        raise error if provider.razorpay_oauth? || !amount_whole_number_error?(error)

        Rails.logger.warn(
          "Retrying Razorpay payment link creation with minimal payload for invoice #{invoice.id}: #{error.message}"
        )
        client.create_payment_link(minimal_payment_link_payload)
      end

      def amount_whole_number_error?(error)
        message = error.message.to_s
        message.match?(/\bamount\b.*\b(whole|whole\s*number)\b/i)
      end

      def customer_payload
        {
          name: invoice.client.name,
          email: invoice.client.email,
          contact: invoice.client.phone
        }.compact
      end

      def notify_existing_payment_link
        client.notify_payment_link(invoice.razorpay_payment_link_id, "sms")
        @sms_sent = true
      end

      def notify_sms?
        ActiveModel::Type::Boolean.new.cast(@notify_sms)
      end

      def notes_payload
        {
          miru_invoice_id: invoice.id.to_s,
          invoice_number: invoice.invoice_number.to_s,
          company_id: invoice.company_id.to_s,
          platform_fee_percent: provider.razorpay_oauth? ? nil : platform_fee_percent.to_s
        }.compact
      end

      def route_transfer_options
        return if provider.razorpay_oauth? || !provider.route_transfers_enabled?

        transfer_amount = amount_subunits - platform_fee_subunits
        return if transfer_amount <= 0

        {
          order: {
            transfers: [
              {
                account: provider.linked_account_id,
                amount: transfer_amount,
                currency: invoice.currency,
                notes: {
                  miru_invoice_id: invoice.id.to_s,
                  miru_platform_fee_subunits: platform_fee_subunits.to_s
                }
              }
            ]
          }
        }
      end

      def amount_subunits
        PaymentProviders::RazorpayPaymentLinkVerification.amount_subunits(invoice)
      end

      def platform_fee_subunits
        (amount_subunits * platform_fee_percent / 100).round
      end

      def platform_fee_percent
        BigDecimal(provider.platform_fee_percent.presence || "0")
      end

      def reference_id
        return "miru-inv-#{invoice.id}" unless provider.razorpay_oauth?

        "miru-inv-#{invoice.id}-#{SecureRandom.hex(4)}"
      end

      def client
        @_client ||= PaymentProviders::RazorpayClient.new(provider:)
      end
  end
end
