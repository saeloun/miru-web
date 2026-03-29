# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.expenses expenses do |expense|
  json.extract! expense, :id, :amount, :expense_type, :description, :category_name, :vendor_name
  json.category_name expense.display_category_name
  json.vendor_name expense.display_vendor_name
  json.date expense.formatted_date
  json.receipts expense.attached_receipts_urls
end

json.categories categories do | category |
  json.name category[:name]
end

json.pagy pagination_details
