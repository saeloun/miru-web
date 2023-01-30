# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.expenses expenses do |expense|
  json.extract! expense, :id, :amount, :expense_type, :category_name, :vendor_name
  json.date DateTime.parse(expense.date).strftime("%m.%d.%Y")
end

json.vendors vendors do | vendor |
  json.id vendor.id
  json.name vendor.name
end

json.categories categories do | category |
  json.id category.id
  json.name category.name
  json.default category.default
end

json.pagy pagination_details
