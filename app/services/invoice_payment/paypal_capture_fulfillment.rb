# frozen_string_literal: true

class InvoicePayment::PaypalCaptureFulfillment
  attr_reader :invoice, :order_id, :error

  def initialize(invoice:, order_id:)
    @invoice = invoice
    @order_id = order_id.to_s
  end

  def process
    return fail_with("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return fail_with("PayPal order id is required") if order_id.blank?

    payment = settle_under_lock
    return false if error.present?

    send_payment_emails if payment.present? && invoice.paid?
    true
  rescue PaymentProviders::PaypalClient::Error => exception
    Rails.logger.warn("PayPal capture failed for invoice #{invoice.id} order #{order_id}: #{exception.message}")
    fail_with(exception.message)
  end

  private

    def settle_under_lock
      invoice.with_lock do
        return nil if invoice.paid?

        order = capture_or_fetch_order
        purchase_unit = Array(order["purchase_units"]).first || {}
        capture = completed_capture(purchase_unit)
        return validation_error("PayPal payment is not completed") if capture.blank?
        return validation_error("PayPal order does not belong to this invoice") unless purchase_unit["custom_id"] == invoice.id.to_s
        return validation_error("PayPal capture currency does not match the invoice") unless capture.dig("amount", "currency_code").to_s.casecmp?(invoice.currency)

        provider_event_id = "paypal:#{capture['id']}"
        return nil if Payment.exists?(provider_event_id:)

        InvoicePayment::Settle.process(payment_params(order, capture, provider_event_id), invoice).tap do
          invoice.update!(
            paypal_order_id: order["id"],
            paypal_order_status: order["status"],
            paypal_capture_id: capture["id"]
          )
        end
      end
    end

    def capture_or_fetch_order
      client.capture_order(order_id, request_id: "capture-#{invoice.id}-#{order_id}")
    rescue PaymentProviders::PaypalClient::Error => exception
      raise unless exception.issue == "ORDER_ALREADY_CAPTURED"

      client.show_order(order_id)
    end

    def completed_capture(purchase_unit)
      Array(purchase_unit.dig("payments", "captures")).find { |capture| capture["status"] == "COMPLETED" }
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
    end

    def payer_name(order)
      name = order.dig("payer", "name") || {}
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

    def provider
      @_provider ||= invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def client
      @_client ||= PaymentProviders::PaypalClient.new(provider:)
    end

    def validation_error(message)
      @error = message
      nil
    end

    def fail_with(message)
      @error = message
      false
    end
end
