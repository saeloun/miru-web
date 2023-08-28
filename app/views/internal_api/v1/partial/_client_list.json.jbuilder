# frozen_string_literal: true

json.label client[:name]
json.value client[:id]
json.address client[:address]
json.phone client[:phone]
json.email client[:email]
json.logo client[:logo] ? polymorphic_url(client[:logo]) : ""
json.previousInvoiceNumber client[:previousInvoiceNumber] || 0