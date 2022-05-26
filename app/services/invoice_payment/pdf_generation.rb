# frozen_string_literal: true

module InvoicePayment
  class PdfGeneration < ApplicationService
    def initialize(invoice, company_logo)
      @invoice = invoice
      @company_logo = company_logo
    end

    def process
      formatted_invoice = format_invoice(@invoice.invoice_line_items)
      base_currency = @invoice.company.base_currency
      controller = ActionController::Base.new
      html = controller.render_to_string(
        template: "invoices/pdf",
        layout: "layouts/pdf",
        locals: {
          invoice: @invoice,
          invoice_amount: format_currency(base_currency, @invoice.amount),
          invoice_tax: format_currency(base_currency, @invoice.tax),
          invoice_amount_due: format_currency(base_currency, @invoice.amount_due),
          invoice_amount_paid: format_currency(base_currency, @invoice.amount_paid),
          invoice_discount: format_currency(base_currency, @invoice.discount),
          company_logo: @company_logo,
          client: @invoice.client,
          invoice_line_items: formatted_invoice[:invoice_line_items],
          sub_total: format_currency(base_currency, formatted_invoice[:sub_total]),
          total: format_currency(base_currency, formatted_invoice[:total])
        }
      )

      options = {
        wait_until: ["networkidle0", "load", "domcontentloaded", "networkidle2"]
      }
      Grover.new(html, options).to_pdf
    end

    private

      def format_invoice(invoice_line_items)
        sub_total = 0
        total = 0

        new_invoice_line_items = []
        invoice_line_items.each do |line_item|
          new_line_item = {}
          new_line_item[:name] = line_item.name
          new_line_item[:date] = line_item.date
          new_line_item[:description] = line_item.description
          new_line_item[:rate] = line_item.rate
          new_line_item[:quantity] = line_item.quantity / 60
          new_line_item[:line_total] = new_line_item[:quantity] * line_item.rate.to_i
          new_invoice_line_items << new_line_item

          sub_total += new_line_item[:line_total]
        end

        {
          invoice_line_items: new_invoice_line_items,
          sub_total:,
          total: sub_total + @invoice.tax - @invoice.discount
        }
      end

      def format_currency(base_currency, amount)
        Money.locale_backend = :currency
        Money.from_amount(amount, base_currency).format
      end
  end
end
