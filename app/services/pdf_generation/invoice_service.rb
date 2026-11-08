# frozen_string_literal: true

module PdfGeneration
  class InvoiceService < HtmlTemplateService
    attr_reader :invoice, :company_logo_url, :root_url

    def initialize(invoice, company_logo_url = nil, root_url = nil)
      @invoice = invoice
      @company_logo_url = company_logo_url
      @root_url = root_url

      super(
        "pdfs/invoices",
        layout: "layouts/pdf",
        locals: build_invoice_locals,
        options: invoice_pdf_options,
        root_url: root_url
      )
    end

    private

      def build_invoice_locals
        amounts = formatted_invoice_amounts
        subtotal = Invoice.line_item_subtotal(invoice.invoice_line_items.pluck(:quantity, :rate))

        {
          invoice: invoice,
          **amounts,
          company_logo: company_logo_url || "",
          client: invoice.client,
          invoice_line_items: build_line_items,
          invoice_taxes: build_invoice_taxes,
          sub_total: format_currency(subtotal),
          total: amounts[:invoice_amount],
          signature_url: resolve_signature_url
        }
      end

      def build_line_items
        invoice.invoice_line_items.map do |item|
          InvoiceLineItemPresenter.new(item).pdf_row(invoice.currency)
        end
      end

      def build_invoice_taxes
        invoice.invoice_taxes.map do |invoice_tax|
          {
            name: invoice_tax.name,
            amount: format_currency(invoice_tax.amount)
          }
        end
      end

      def formatted_invoice_amounts
        {
          invoice_amount: format_currency(invoice.amount),
          invoice_tax: format_currency(invoice.tax),
          invoice_amount_due: format_currency(invoice.amount_due),
          invoice_amount_paid: format_currency(invoice.amount_paid),
          invoice_discount: format_currency(invoice.discount)
        }
      end

      def format_currency(amount)
        FormatAmountService.new(invoice.currency, amount).process
      end

      def resolve_signature_url
        company = invoice.company
        client = invoice.client

        return nil unless client.signature_enabled?
        return nil unless company.invoice_signature.attached?

        signature_path = Rails.application.routes.url_helpers.polymorphic_url(
          company.invoice_signature,
          only_path: true
        )
        return signature_path if root_url.blank?

        "#{root_url.delete_suffix('/')}#{signature_path}"
      rescue StandardError
        nil
      end

      def invoice_pdf_options
        {
          format: "A4",
          margin: {
            top: 18,
            bottom: 18,
            left: 18,
            right: 18
          },
          print_background: true,
          prefer_css_page_size: false
        }
      end
  end
end
