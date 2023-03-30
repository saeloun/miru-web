# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.currency current_company.base_currency
json.clients clients do |client|
  json.name client[:name]
  json.logo client[:logo]
  json.paid_amount client[:paid_amount]
  json.outstanding_amount client[:outstanding_amount]
  json.overdue_amount client[:overdue_amount]
  json.total_amount client[:paid_amount] + client[:outstanding_amount] + client[:overdue_amount]
end
json.summary do
  json.total_paid_amount summary[:total_paid_amount]
  json.total_outstanding_amount summary[:total_outstanding_amount]
  json.total_revenue summary[:total_revenue]
end
