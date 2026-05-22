# frozen_string_literal: true

json.id invoice_tax.id
json.tax_configuration_id invoice_tax.tax_configuration_id
json.name invoice_tax.name
json.calculation_method invoice_tax.calculation_method
json.value invoice_tax.value.to_f
json.amount invoice_tax.amount.to_f
