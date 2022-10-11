# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.invoices do
  json.partial! "internal_api/v1/partial/invoice_item", locals: { invoices: }
end
json.recently_updated_invoices do
  json.partial! "internal_api/v1/partial/invoice_item", locals: { invoices: recently_updated_invoices }
end
json.summary summary
json.pagy pagy
