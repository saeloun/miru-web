# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.partial! "internal_api/v1/partial/invoice", locals: { invoice: invoice }
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: invoice.client }
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: invoice.client.company }
end
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.partial! "internal_api/v1/partial/invoice_line_item", locals: { invoice_line_item: }
end
