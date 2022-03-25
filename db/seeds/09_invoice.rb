# frozen_string_literal: true

# Invoice Start
invoice_1_india = {
  issue_date: Date.today,
  due_date: (Date.today + 30),
  invoice_number: "SAI-C1-01",
  reference: "Client 1 Saeloun India 1st Invoice",
  amount: 5000,
  outstanding_amount: 2000,
  tax: 500,
  amount_paid: 3000,
  amount_due: 1000,
  discount: 500,
  status: Invoice.statuses[:paid],
  company_id: @saeloun_india.id,
  client_id: @client_1_saeloun_india.id
}
invoice_2_india = {
  issue_date: Date.today,
  due_date: (Date.today + 30), invoice_number: "SAI-C1-02",
  reference: "Client 1 Saeloun India 2nd Invoice",
  amount: 5000,
  outstanding_amount: 2000,
  tax: 500,
  amount_paid: 3000,
  amount_due: 1000,
  discount: 500,
  status: Invoice.statuses[:paid],
  company_id: @saeloun_india.id,
  client_id: @client_1_saeloun_india.id
}

@invoice_1_client_1_saeloun_india = @client_1_saeloun_india.invoices.create!(invoice_1_india)
@invoice_2_client_1_saeloun_india = @client_1_saeloun_india.invoices.create!(invoice_2_india)

puts "Invoice Created"
# Invoice End
