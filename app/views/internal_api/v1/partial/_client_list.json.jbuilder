# frozen_string_literal: true

json.id client.id
json.name client.name
json.email client.email
json.phone client.phone
json.address client.current_address
json.previousInvoiceNumber client.invoices&.last&.invoice_number || 0
json.client_members client.send_invoice_emails(@virtual_verified_invitations_allowed)
json.logo client[:logo] ? polymorphic_url(client[:logo]) : ""
