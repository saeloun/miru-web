# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

include_financial_details = !current_user.has_role?(:client, current_company)

json.partial! "internal_api/v1/partial/invoice", locals: { invoice:, include_financial_details: }
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: }
  json.client_members_emails client_member_emails
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: client.company, include_financial_details: }
end
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.partial! "internal_api/v1/partial/invoice_line_item", locals: { invoice_line_item: }
end
json.invoice_taxes invoice.invoice_taxes do |invoice_tax|
  json.partial! "internal_api/v1/partial/invoice_tax", locals: { invoice_tax: }
end
