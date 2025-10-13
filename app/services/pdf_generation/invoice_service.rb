# frozen_string_literal: true

module PdfGeneration
  class InvoiceService < HtmlTemplateService
    attr_reader :invoice, :company_logo_url

    def initialize(invoice, company_logo_url = nil, root_url = nil)
      @invoice = invoice
      @company_logo_url = company_logo_url

      super(
        "pdfs/invoices",
        layout: "layouts/pdf",
        locals: build_invoice_locals,
        options: invoice_pdf_options,
        root_url:
      )
    end

    private

      def build_invoice_locals
        {
          invoice:,
          invoice_amount: format_currency(invoice.amount),
          invoice_tax: format_currency(invoice.tax),
          invoice_amount_due: format_currency(invoice.amount_due),
          invoice_amount_paid: format_currency(invoice.amount_paid),
          invoice_discount: format_currency(invoice.discount),
          company_logo: company_logo_url || "",
          client: invoice.client,
          invoice_line_items: build_line_items,
          sub_total: format_currency(calculate_subtotal),
          total: format_currency(calculate_total)
        }
      end

      def build_line_items
        invoice.invoice_line_items.map do |item|
          InvoiceLineItemPresenter.new(item).pdf_row(invoice.currency)
        end
      end

      def calculate_subtotal
        invoice.invoice_line_items.total_cost_of_all_line_items
      end

      def calculate_total
        subtotal = calculate_subtotal
        tax = invoice.tax || 0
        discount = invoice.discount || 0
        subtotal + tax - discount
      end

      def format_currency(amount)
        FormatAmountService.new(invoice.currency, amount).process
      end

      def invoice_pdf_options
        {
          format: :A4,
          margin_top: 0.25,
          margin_bottom: 0.25,
          margin_left: 0.25,
          margin_right: 0.25,
          print_background: true,
          prefer_css_page_size: false
        }
      end
  end
end
