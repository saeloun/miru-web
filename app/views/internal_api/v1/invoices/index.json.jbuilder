# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.invoices do
  json.array! invoices do |invoice|
    json.id invoice.id
    json.invoice_number invoice.invoice_number
    json.issue_date invoice.issue_date
    json.due_date invoice.due_date
    json.amount invoice.amount
    json.client do
      json.name invoice.client.name
    end
    json.company do
      json.name current_company.name
      json.base_currency current_company.base_currency
      json.date_format current_company.date_format || "YYYY-MM-DD"
    end
    json.status invoice.status
  end
end
json.summary summary
json.pagy pagy


