# frozen_string_literal: true

class InvoicePayment::PaypalCaptureFulfillment
  attr_reader :invoice, :order_id, :error, :error_code

  def initialize(invoice:, order_id:)
    @invoice = invoice
    @order_id = order_id.to_s
    @settled = false
  end

  def process
    return fail_with("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return fail_with("PayPal order id is required") if order_id.blank?

    payment = settle_under_lock
    return false if error.present?

    @settled = payment.present?
    send_payment_emails if payment.present? && invoice.paid?
    true
  rescue PaymentProviders::PaypalClient::Error => exception
    capture_failure(exception, "PayPal capture failed")
    fail_with(exception.message, transient?(exception) ? :provider_unavailable : nil)
  rescue ActiveRecord::RecordInvalid => exception
    capture_failure(exception, "PayPal capture could not be recorded")
    fail_with(exception.record.errors.full_messages.to_sentence)
  rescue ArgumentError, KeyError, TypeError => exception
    capture_failure(exception, "PayPal capture response could not be read")
    fail_with("PayPal returned an unexpected capture response")
  end

  def settled?
    @settled
  end

  private

    # PayPal is called before the lock is taken so a slow capture cannot hold the invoice row.
    # The request id makes the capture idempotent, and a replay returns ORDER_ALREADY_CAPTURED.
    def settle_under_lock
      return nil if invoice.paid?

      expected_order_id = invoice.paypal_order_id
      order = capture_or_fetch_order
      purchase_unit = Array(order["purchase_units"]).first || {}
      capture = capture_from(purchase_unit)
      owned = belongs_to_invoice?(purchase_unit, capture, expected_order_id)

      invoice.with_lock do
        record_order_details(order, capture)
        return nil if invoice.paid?

        return validation_error("PayPal payment is not completed") unless completed?(capture)
        return validation_error("PayPal order does not belong to this invoice") unless owned
        return validation_error("PayPal capture currency does not match the invoice") unless currency_matches?(capture)

        provider_event_id = "paypal:#{capture['id']}"
        return nil if Payment.exists?(provider_event_id:)

        log_amount_mismatch(capture)
        InvoicePayment::Settle.process(payment_params(order, capture, provider_event_id), invoice)
      end
    end

    def capture_or_fetch_order
      client.capture_order(order_id, request_id: "capture-#{invoice.id}-#{order_id}")
    rescue PaymentProviders::PaypalClient::Error => exception
      raise unless exception.issue == "ORDER_ALREADY_CAPTURED"

      client.show_order(order_id)
    end

    def capture_from(purchase_unit)
      captures = Array(purchase_unit.dig("payments", "captures"))
      captures.find { |capture| capture["status"] == "COMPLETED" } || captures.first || {}
    end

    def completed?(capture)
      capture["status"] == "COMPLETED"
    end

    # PayPal echoes custom_id on the purchase unit, the capture, or neither. When neither carries it,
    # fall back to the order id Miru stored when it created the order for this invoice.
    def belongs_to_invoice?(purchase_unit, capture, expected_order_id)
      custom_ids = [purchase_unit["custom_id"], capture["custom_id"]].compact_blank
      return custom_ids.include?(invoice.id.to_s) if custom_ids.any?

      expected_order_id.present? && expected_order_id == order_id
    end

    def currency_matches?(capture)
      capture.dig("amount", "currency_code").to_s.casecmp?(invoice.currency)
    end

    def zero_decimal?
      PaymentsProvider::PAYPAL_ZERO_DECIMAL_CURRENCIES.include?(invoice.currency.to_s.upcase)
    end

    def record_order_details(order, capture)
      invoice.update!(
        paypal_order_id: order["id"].presence || order_id,
        paypal_order_status: order["status"],
        paypal_capture_id: capture["id"].presence || invoice.paypal_capture_id
      )
    end

    def log_amount_mismatch(capture)
      captured = PaymentProviders::PaypalAmount.parse(capture.dig("amount", "value"))
      return if captured == invoice.amount_due
      # Zero-decimal currencies are rounded up when the order is created, so a sub-unit gap is expected.
      return if zero_decimal? && (captured - invoice.amount_due).abs < 1

      Rails.logger.warn(
        "PayPal capture #{capture['id']} for invoice #{invoice.id} was #{captured}, amount due #{invoice.amount_due}"
      )
      Sentry.capture_message(
        "PayPal capture does not match the invoice amount due",
        level: :warning,
        extra: { invoice_id: invoice.id, captured:, amount_due: invoice.amount_due }
      ) if defined?(Sentry)
    end

    def payment_params(order, capture, provider_event_id)
      {
        invoice_id: invoice.id,
        transaction_date: transaction_date(capture["create_time"]),
        transaction_type: "paypal",
        amount: PaymentProviders::PaypalAmount.parse(capture.dig("amount", "value")),
        payment_currency: invoice.currency,
        provider_event_id:,
        note: "PayPal_Payment_Success",
        name: payer_name(order)
      }
    end

    def transaction_date(create_time)
      Time.zone.parse(create_time.to_s)&.to_date || Date.current
    rescue ArgumentError
      Date.current
    end

    def payer_name(order)
      name = order.dig("payer", "name")
      return nil unless name.is_a?(Hash)

      [name["given_name"], name["surname"]].compact_blank.join(" ").presence
    end

    def send_payment_emails
      PaymentMailer.with(
        invoice_id: invoice.id,
        subject: "Payment details by #{invoice.client.name}"
      ).payment.deliver_later

      invoice.send_to_client_email(
        invoice_id: invoice.id,
        subject: "Payment Confirmation of Invoice #{invoice.invoice_number} by #{invoice.client.name}"
      )
    end

    def capture_failure(exception, message)
      Rails.logger.warn(
        "[PayPal] #{message} invoice_id=#{invoice.id} order_id=#{order_id} " \
        "error_class=#{exception.class} error=#{exception.message}"
      )
      Sentry.capture_exception(
        exception,
        extra: { invoice_id: invoice.id, paypal_order_id: order_id }
      ) if defined?(Sentry)
    end

    def provider
      @_provider ||= invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def client
      @_client ||= PaymentProviders::PaypalClient.new(provider:)
    end

    # PayPal has already taken the money at this point, so a rejected capture is an alert, not a log line.
    def validation_error(message)
      @error = message
      Rails.logger.warn("[PayPal] capture rejected invoice_id=#{invoice.id} order_id=#{order_id} reason=#{message}")
      Sentry.capture_message(
        "PayPal capture rejected after the payer was charged",
        level: :error,
        extra: { invoice_id: invoice.id, paypal_order_id: order_id, reason: message }
      ) if defined?(Sentry)
      nil
    end

    def fail_with(message, code = nil)
      @error = message
      @error_code = code
      false
    end

    # A transport failure or a PayPal 5xx may succeed on a retry; a rejection will not.
    def transient?(exception)
      exception.status.nil? || exception.status >= 500
    end
end
