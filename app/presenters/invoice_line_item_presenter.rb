# frozen_string_literal: true

class InvoiceLineItemPresenter
  attr_reader :invoice_line_item

  def initialize(invoice_line_item)
    @invoice_line_item = invoice_line_item
  end

  def pdf_row(base_currency)
    {
      name: invoice_line_item.name,
      date: invoice_line_item.formatted_date,
      description: invoice_line_item.description,
      quantity: invoice_line_item.time_spent,
      rate: formatted_amount(base_currency, invoice_line_item.rate),
      line_total: formatted_amount(base_currency, invoice_line_item.total_cost)
    }
  end

  private

    def formatted_amount(currency, amount)
      FormatAmountService.new(currency, amount).process
    end
end
