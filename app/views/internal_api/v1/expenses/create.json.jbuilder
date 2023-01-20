# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id expense.id
json.vendor_name vendor&.name
json.category_name expense_category.name
json.amount expense.amount
json.date expense.date
json.description expense.description
json.type expense.expense_type
