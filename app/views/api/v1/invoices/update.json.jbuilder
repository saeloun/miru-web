json.invoice do
  json.id invoice.id
  json.invoice_number invoice.invoice_number
  json.client_id invoice.client_id
  json.client_name invoice.client&.name
  json.status invoice.status
  json.issue_date invoice.issue_date
  json.due_date invoice.due_date
  json.amount invoice.amount.to_f
  json.amount_due invoice.amount_due.to_f
  json.currency invoice.currency || invoice.company.base_currency
  json.created_at invoice.created_at
  json.updated_at invoice.updated_at
end

json.client do
  json.id client.id
  json.name client.name
end