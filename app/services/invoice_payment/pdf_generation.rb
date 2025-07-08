# frozen_string_literal: true

module InvoicePayment
  class PdfGeneration < ApplicationService
    def initialize(invoice, company_logo, root_url, filepath = nil)
      @invoice = invoice
      @invoice_line_items = @invoice.invoice_line_items
      @company_logo = company_logo || ""
      # Updated to use the invoice currency instead of the company currency
      @base_currency = invoice.currency
      @root_url = root_url
      @filepath = filepath
    end

    def process
      invoice_data = build_invoice
      locals = {
        invoice: @invoice,
        invoice_amount: format_currency(@invoice.amount),
        invoice_tax: format_currency(@invoice.tax),
        invoice_amount_due: format_currency(@invoice.amount_due),
        invoice_amount_paid: format_currency(@invoice.amount_paid),
        invoice_discount: format_currency(@invoice.discount),
        company_logo: @company_logo,
        client: @invoice.client,
        invoice_line_items: invoice_data[:invoice_line_items],
        sub_total: format_currency(invoice_data[:sub_total]),
        total: format_currency(invoice_data[:total])
      }

      Pdf::HtmlGenerator.new(
        :invoices,
        locals:,
        path: @filepath,
        root_url: @root_url
      ).make
    end

    private

      def build_invoice
        sub_total = @invoice_line_items.total_cost_of_all_line_items

        rows = @invoice_line_items.map do |invoice_line_item|
          InvoiceLineItemPresenter.new(invoice_line_item).pdf_row(@base_currency)
        end

        {
          invoice_line_items: rows,
          sub_total:,
          total: sub_total + @invoice.tax - @invoice.discount
        }
      end

      def format_currency(amount)
        FormatAmountService.new(@base_currency, amount).process
      end
  end
end
