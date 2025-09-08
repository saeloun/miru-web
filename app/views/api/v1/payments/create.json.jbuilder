# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.payment do
  json.id payment.id
  json.client_name client.name
  json.invoice_number invoice.invoice_number
  json.transaction_date payment.transaction_date
  json.note payment.note
  json.transaction_type payment.transaction_type
  json.amount payment.amount
  json.status payment.status
end

json.base_currency current_company.base_currency
