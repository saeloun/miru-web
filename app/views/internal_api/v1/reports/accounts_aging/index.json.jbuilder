# frozen_string_literal: true

json.report do
  json.clients clients do |client|
    json.extract! client, :id, :name, :logo, :amount_overdue
  end
  json.total_amount_overdue total_amount_overdue_by_date_range
  json.base_currency base_currency
end
