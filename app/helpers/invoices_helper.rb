# frozen_string_literal: true

module InvoicesHelper
  def serializer(invoice_line_items)
    sub_total = 0
    total = 0

    new_invoice_line_items = []
    invoice_line_items.each do |line_item|
      new_line_item = {}
      new_line_item[:name] = line_item.name
      new_line_item[:date] = line_item.date
      new_line_item[:description] = line_item.description
      new_line_item[:rate] = line_item.rate
      new_line_item[:quantity] = line_item.quantity
      new_line_item[:line_total] = line_item.quantity.to_i * line_item.rate.to_i
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
