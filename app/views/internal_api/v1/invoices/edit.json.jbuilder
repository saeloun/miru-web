# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.partial! "internal_api/v1/partial/invoice", locals: { invoice: }
json.client do
  json.value invoice.client.id
  json.label invoice.client.name
  json.address invoice.client.address
  json.phone invoice.client.phone
  json.email invoice.client.email
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: invoice.client.company }
end
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.partial! "internal_api/v1/partial/invoice_line_item", locals: { invoice_line_item: }
end

json.company_client_list current_company.client_list do |client|
  json.partial! "internal_api/v1/partial/client_list", locals: { client: }
end

json.line_items invoice.client.new_line_item_entries([])
