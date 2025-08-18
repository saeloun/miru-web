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
  json.outstanding_amount invoice.outstanding_amount.to_f
  json.tax invoice.tax.to_f
  json.discount invoice.discount.to_f
  json.currency invoice.currency || invoice.company.base_currency
  json.reference invoice.reference
  json.created_at invoice.created_at
  json.updated_at invoice.updated_at
  
  json.invoice_line_items invoice.invoice_line_items do |item|
    json.id item.id
    json.name item.name
    json.description item.description
    json.quantity item.quantity
    json.rate item.rate.to_f
    json.amount (item.quantity * item.rate).to_f
  end
end

json.client do
  json.id client.id
  json.name client.name
  json.email client.email
  json.phone client.phone
  json.address client.address
end

json.client_member_emails client_member_emails