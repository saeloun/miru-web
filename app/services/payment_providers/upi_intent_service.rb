# frozen_string_literal: true

require "rqrcode"
require "base64"
require "uri"

module PaymentProviders
  class UpiIntentService
    attr_reader :provider, :invoice

    def initialize(provider:, invoice: nil)
      @provider = provider
      @invoice = invoice
    end

    def details
      return {} unless provider&.upi_configured?

      {
        enabled: provider.enabled?,
        enabled_on_invoices: provider.enabled_on_invoices?,
        upi_id: provider.upi_id,
        payee_name: payee_name,
        payment_link: payment_link,
        qr_code_svg: qr_code_svg,
        qr_code_data_uri: qr_code_data_uri
      }
    end

    def payment_link
      query = {
        pa: provider.upi_id,
        pn: payee_name,
        cu: currency
      }
      query[:am] = amount if amount.present?
      query[:tn] = transaction_note if transaction_note.present?
      query[:mc] = provider.merchant_category_code if provider.merchant_category_code.present?

      "upi://pay?#{URI.encode_www_form(query)}"
    end

    def qr_code_svg
      RQRCode::QRCode.new(payment_link).as_svg(
        color: "000",
        shape_rendering: "crispEdges",
        module_size: 4,
        standalone: true,
        use_path: true,
        viewbox: true
      )
    end

    def qr_code_data_uri
      "data:image/svg+xml;base64,#{Base64.strict_encode64(qr_code_svg)}"
    end

    private

      def amount
        return unless invoice&.amount_due.present?

        format("%.2f", invoice.amount_due)
      end

      def currency
        "INR"
      end

      def payee_name
        provider.payee_name.presence || provider.company.name
      end

      def transaction_note
        return unless invoice&.invoice_number.present?

        "Invoice #{invoice.invoice_number}"
      end
  end
end
