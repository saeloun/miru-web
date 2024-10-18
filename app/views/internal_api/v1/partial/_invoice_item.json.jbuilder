# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.array! invoices do |invoice|
    json.id invoice.id
    json.invoice_number invoice.invoice_number
    json.issue_date invoice.formatted_issue_date
    json.due_date invoice.formatted_due_date
    json.amount invoice.amount
    json.external_view_key invoice.external_view_key
    json.client do
      json.name invoice.client_name
      json.email invoice.client_email
      json.logo invoice.client_logo_url
      json.client_members_emails invoice.client.send_invoice_emails(@virtual_verified_invitations_allowed)
      json.client_payment_reminder_emails invoice.client.subscribed_client_reminders_recipients
    end
    json.company do
      json.name current_company.name
      json.base_currency current_company.base_currency
      json.date_format current_company.date_format
    end
    json.status invoice.status
  end
