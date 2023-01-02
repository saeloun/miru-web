# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.payments payments do |payment|
  json.extract! payment,
    :id, :client_name, :invoice_number, :transaction_date, :note, :transaction_type, :amount, :status
end

json.base_currency current_company.base_currency
