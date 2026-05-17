# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_tax do
    invoice
    tax_configuration { association(:tax_configuration, company: invoice.company) }
    name { tax_configuration.name }
    calculation_method { tax_configuration.calculation_method }
    value { tax_configuration.value }
    amount { tax_configuration.calculate_amount(invoice.invoice_line_items.total_cost_of_all_line_items) }
  end
end
