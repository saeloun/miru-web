# frozen_string_literal: true

class InvoiceLineItemPresenter
  attr_reader :invoice_line_item

  def initialize(invoice_line_item)
    @invoice_line_item = invoice_line_item
  end

  def pdf_row(base_currency)
    {
      name: invoice_line_item.name,
      date: CompanyDateFormattingService.new(invoice_line_item.date, company:).process
      description: invoice_line_item.description,
      quantity: invoice_line_item.time_spent,
      rate: FormatAmountService.new(base_currency, invoice_line_item.rate).process,
      line_total: FormatAmountService.new(base_currency, invoice_line_item.total_cost).process
    }
  end
end
