# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.expenses expenses do |expense|
  json.extract! expense, :id, :amount, :expense_type, :category_name, :vendor_name
  json.date DateTime.parse(expense.date).strftime("%m.%d.%Y")
end

json.pagy pagination_details
