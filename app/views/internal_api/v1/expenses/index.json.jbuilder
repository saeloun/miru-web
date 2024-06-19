# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.expenses expenses do |expense|
  json.extract! expense, :id, :amount, :expense_type, :description
  json.category_name expense.expense_category.name
  json.vendor_name expense.vendor&.name
  json.date expense.formatted_date
  json.receipts expense.attached_receipts_urls
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
