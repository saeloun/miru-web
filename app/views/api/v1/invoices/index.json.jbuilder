# frozen_string_literal: true

json.invoices invoices do |invoice|
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
  json.currency invoice.currency || current_company.base_currency
  json.created_at invoice.created_at
  json.updated_at invoice.updated_at

  # Include client details for frontend to use
  json.client do
    json.id invoice.client_id
    json.name invoice.client&.name
    json.email invoice.client&.email if invoice.client&.email
    json.logo invoice.client&.logo_url if invoice.client&.logo_url
  end
end

json.pagination_details do
  json.page pagination_details[:page]
  json.pages pagination_details[:pages]
  json.total pagination_details[:total]
end

json.summary do
  json.draftAmount summary[:draftAmount]
  json.outstandingAmount summary[:outstandingAmount]
  json.overdueAmount summary[:overdueAmount]
  json.totalAmount summary[:totalAmount]
  json.currency summary[:currency]
end

json.recentlyUpdatedInvoices recently_updated_invoices do |invoice|
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
  json.updated_at invoice.updated_at

  json.client do
    json.id invoice.client_id
    json.name invoice.client&.name
    json.email invoice.client&.email if invoice.client&.email
    json.logo invoice.client&.logo_url if invoice.client&.logo_url
  end
end
