# frozen_string_literal: true

categories = [
    { name: "Salary", default: true },
    { name: "Repair & Maintenance", default: true },
    { name: "Rent", default: true },
    { name: "Food", default: true },
    { name: "Travel", default: true },
    { name: "Tax", default: true },
    { name: "Furniture", default: true },
    { name: "Health Insurance", default: true },
    { name: "Other", default: true }
]

categories.each do |category|
  ExpenseCategory.create!(category)
end

puts "Default categories created!"
