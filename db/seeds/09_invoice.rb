# frozen_string_literal: true

# Invoice Start
invoice_1_india = { issue_date: Date.parse("2022-01-01"), due_date: Date.parse("2022-03-15") + 30, invoice_number: "SAI-C1-01", reference: "Client 1 Saeloun India 1st Invoice", amount: 5000, outstanding_amount: 2000, tax: 500, amount_paid: 3000, amount_due: 1000, discount: 500, status: 0, client_id: @client_1_saeloun_india.id }
invoice_2_india = { issue_date: Date.parse("2022-02-10"), due_date: Date.parse("2022-03-15") + 30, invoice_number: "SAI-C1-02", reference: "Client 1 Saeloun India 2nd Invoice", amount: 5000, outstanding_amount: 2000, tax: 500, amount_paid: 3000, amount_due: 1000, discount: 500, status: 1, client_id: @client_1_saeloun_india.id }
invoice_3_india = { issue_date: Date.parse("2022-03-15"), due_date: Date.parse("2022-03-15") + 30, invoice_number: "SAI-C1-03", reference: "Client 1 Saeloun US 1st Invoice", amount: 5000, outstanding_amount: 2000, tax: 500, amount_paid: 3000, amount_due: 1000, discount: 500, status: 2, client_id: @client_2_saeloun_india.id }

@invoice_1_client_1_saeloun_india = @client_1_saeloun_india.invoices.create!(invoice_1_india)
@invoice_2_client_1_saeloun_india = @client_1_saeloun_india.invoices.create!(invoice_2_india)
@invoice_3_client_2_saeloun_india = @client_2_saeloun_india.invoices.create!(invoice_3_india)

puts "Invoice Created"
# Invoice End
