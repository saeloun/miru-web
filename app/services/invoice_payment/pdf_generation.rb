# frozen_string_literal: true

module InvoicePayment
  class PdfGeneration < ApplicationService
    def initialize(invoice, company_logo)
      @invoice = invoice
      @company_logo = company_logo
    end

    def process
      formatted_invoice = format_invoice(@invoice.invoice_line_items)

      controller = ActionController::Base.new
      html = controller.render_to_string(
        template: "invoices/pdf",
        layout: "layouts/pdf",
        locals: {
          invoice: @invoice,
          company_logo: @company_logo,
          client: @invoice.client,
          invoice_line_items: formatted_invoice[:invoice_line_items],
          sub_total: formatted_invoice[:sub_total],
          total: formatted_invoice[:total]
        }
      )
      Grover.new(html).to_pdf
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
  end
end
