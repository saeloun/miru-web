# frozen_string_literal: true

categories = [
    { name: "Salary", icon: "", color: "", default: true },
    { name: "Repair & Maintenance", icon: "", color: "", default: true },
    { name: "Rent", icon: "", color: "", default: true },
    { name: "Food", icon: "", color: "", default: true },
    { name: "Travel", icon: "", color: "", default: true },
    { name: "Tax", icon: "", color: "", default: true },
    { name: "Furniture", icon: "", color: "", default: true },
    { name: "Health Insurance", icon: "", color: "", default: true },
    { name: "Other", icon: "", color: "", default: true }
]

categories.each do |category|
  ExpenseCategory.create!(category)
end

puts "Default categories created!"
