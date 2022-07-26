# frozen_string_literal: true

# Payment Start
payment_1 = {
  amount: 3000,
  note: "This is payment note",
  status: :partially_paid,
  transaction_date: Date.today - 7,
  transaction_type: :visa
}
payment_2 = {
  amount: 5000,
  note: "This is payment note",
  status: :paid,
  transaction_date: Date.today - 3,
  transaction_type: :credit_card
}

@payment_1_india = @invoice_2_microsoft_saeloun_india.payments.create!(payment_1)
@payment_2_india = @invoice_3_microsoft_saeloun_india.payments.create!(payment_2)

puts "Payments Created"

# Payment End
