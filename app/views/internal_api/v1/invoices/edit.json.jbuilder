# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.partial! "internal_api/v1/partial/invoice", locals: { invoice: }
json.client do
  json.id client.id
  json.name client.name
  json.address client.current_address
  json.phone client.phone
  json.email client.email
  json.client_members_emails client_member_emails
  json.currency client.currency
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: client.company }
end
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.partial! "internal_api/v1/partial/invoice_line_item", locals: { invoice_line_item: }
end
json.company_client_list client_list do |client|
  json.partial! "internal_api/v1/partial/client_list", locals: { client: }
end
