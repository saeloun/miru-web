# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.currency current_company.base_currency
json.clients client_revenues do |client|
  json.name client[:name]
  json.logo client[:logo]
  paid = client[:paid_amount] || 0
  outstanding = client[:outstanding_amount] || 0
  overdue = client[:overdue_amount] || 0
  json.paid_amount paid == 0 ? 0 : paid.to_s
  json.outstanding_amount outstanding.to_s
  json.overdue_amount overdue.to_s
  json.total_amount (paid + outstanding + overdue).to_s
end
json.summary do
  json.total_paid_amount summary[:total_paid_amount]
  json.total_outstanding_amount summary[:total_outstanding_amount]
  json.total_revenue summary[:total_revenue]
end
