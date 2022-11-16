# frozen_string_literal: true

json.report do
  json.clients clients do |client|
    json.id client.id
    json.name client.name
    json.amount_overdue do
      json.zero_to_thirty_days client.invoices.during(1.month.ago..Date.today).pluck(:amount_due).sum
      json.thirty_one_to_sixty_days client.invoices.during(2.month.ago..1.month.ago).pluck(:amount_due).sum
      json.sixty_one_to_ninety_days client.invoices.during(3.month.ago..2.month.ago).pluck(:amount_due).sum
      json.ninety_plus_days client.invoices.during(10.year.ago..3.month.ago).pluck(:amount_due).sum
      json.total client.invoices.pluck(:amount_due).sum
    end
  end
  json.total_amount_overdue do
    json.zero_to_thirty_days invoice_overdue.during(1.month.ago..Date.today).pluck(:amount_due).sum
    json.thirty_one_to_sixty_days invoice_overdue.during(2.month.ago..1.month.ago).pluck(:amount_due).sum
    json.sixty_one_to_ninety_days invoice_overdue.during(3.month.ago..2.month.ago).pluck(:amount_due).sum
    json.ninety_plus_days invoice_overdue.during(10.year.ago..3.month.ago).pluck(:amount_due).sum
    json.grand_total invoice_overdue.pluck(:amount_due).sum
  end
end
