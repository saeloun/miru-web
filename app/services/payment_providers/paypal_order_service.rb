# frozen_string_literal: true

module PaymentProviders
  class PaypalOrderService
    APPROVAL_LINK_RELS = ["payer-action", "approve"].freeze

    def self.reference_id(invoice)
      digest = OpenSSL::HMAC.hexdigest(
        "SHA256",
        Rails.application.secret_key_base,
        "paypal-order:#{invoice.company_id}:#{invoice.id}"
      )
      "miru-inv-#{digest}"
    end

    attr_reader :invoice, :provider, :return_url, :cancel_url

    def initialize(invoice:, provider:, return_url:, cancel_url:)
      @invoice = invoice
      @provider = provider
      @return_url = return_url
      @cancel_url = cancel_url
    end

    def process
      response = client.create_order(order_payload, request_id: request_id)
      order_id = response["id"].presence
      approval_url = approval_link(response)

      raise PaypalClient::Error, "PayPal did not return an order id" if order_id.blank?
      raise PaypalClient::Error, "PayPal did not return an approval link" if approval_url.blank?

      invoice.update!(
        paypal_order_id: order_id,
        paypal_order_status: response["status"].presence || "CREATED"
      )
      approval_url
    rescue PaypalAmount::UnsupportedAmountError => error
      raise PaypalClient::Error, error.message
    end

    private

      def order_payload
        {
          intent: "CAPTURE",
          purchase_units: [{
            reference_id: self.class.reference_id(invoice),
            custom_id: invoice.id.to_s,
            description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}".truncate(127),
            amount: {
              currency_code: invoice.currency.to_s.upcase,
              value: PaypalAmount.format(invoice.amount_due, invoice.currency)
            }
          }],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: invoice.company.name.to_s.truncate(127),
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
                landing_page: "NO_PREFERENCE",
                payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                return_url:,
                cancel_url:
              }
            }
          }
        }
      end

      def request_id
        Digest::SHA256.hexdigest([
          "miru-paypal-order",
          invoice.external_view_key,
          invoice.currency.to_s.upcase,
          PaypalAmount.format(invoice.amount_due, invoice.currency)
        ].join(":"))[0, 38]
      end

      def approval_link(response)
        Array(response["links"]).find { |link| APPROVAL_LINK_RELS.include?(link["rel"]) }&.dig("href")
      end

      def client
        @_client ||= PaypalClient.new(provider:)
      end
  end
end
