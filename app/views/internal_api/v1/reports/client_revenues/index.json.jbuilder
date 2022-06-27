# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.currency current_company.base_currency
json.clients clients do |client|
  json.name client[:name]
  json.paid_amount client[:paid_amount]
  json.unpaid_amount client[:unpaid_amount]
  json.total_amount client[:paid_amount] + client[:unpaid_amount]
end
json.summary do
  json.total_paid_amount summary[:total_paid_amount]
  json.total_unpaid_amount summary[:total_unpaid_amount]
  json.total_revenue summary[:total_revenue]
end
