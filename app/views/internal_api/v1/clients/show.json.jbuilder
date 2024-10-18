# frozen_string_literal: true

json.client_details client_details
json.client_members_emails client_member_emails
json.subscribed_recipients subscribed_recipients
json.project_details project_details
json.total_minutes total_minutes
json.overdue_outstanding_amount overdue_outstanding_amount
json.invoices do
  json.partial! "internal_api/v1/partial/invoice_item", locals: { invoices: }
end
