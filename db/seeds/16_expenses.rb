# frozen_string_literal: true

# Payment Start
expenses = [
    {
      amount: 300000,
      date: Faker::Date.backward(days: 60),
      description: "Salary of x,y,z",
      expense_category_id: 1,
      expense_type: :business
    },
    {
      amount: 5500,
      date: Faker::Date.backward(days: 60),
      description: "Supriya Laptop's servicing",
      expense_category_id: 2,
      vendor_id: @apple_repair_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 10000,
      date: Faker::Date.backward(days: 60),
      description: "Monthly rent",
      expense_category_id: 3,
      expense_type: :business
    },
    {
      amount: 2000,
      date: Faker::Date.backward(days: 60),
      description: "Dinner party",
      expense_category_id: 4,
      vendor_id: @zomato_vendor_india.id,
      expense_type: :personal
    },
    {
      amount: 67000,
      date: Faker::Date.backward(days: 60),
      description: "Vipul US - India flight",
      expense_category_id: 5,
      vendor_id: @booking_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 47000,
      date: Faker::Date.backward(days: 60),
      description: "Employee x client visit",
      expense_category_id: 5,
      vendor_id: @booking_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 56703,
      date: Faker::Date.backward(days: 60),
      description: "Govt tax",
      expense_category_id: 6,
      vendor_id: @ca_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 4350,
      date: Faker::Date.backward(days: 60),
      description: "Office new chair",
      expense_category_id: 7,
      vendor_id: @pepperfry_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 20000,
      date: Faker::Date.backward(days: 60),
      description: "x,y,z employee health insurance",
      expense_category_id: 8,
      vendor_id: @insurance_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 6300,
      date: Faker::Date.backward(days: 60),
      description: "Some xyz expense",
      expense_category_id: 9,
      vendor_id: @booking_vendor_india.id,
      expense_type: :personal
    },
    {
      amount: 12300,
      date: Faker::Date.backward(days: 60),
      description: "Goa vacation",
      expense_category_id: @outing_category_india.id,
      vendor_id: @booking_vendor_india.id,
      expense_type: :business
    },
    {
      amount: 5400,
      date: Faker::Date.backward(days: 60),
      description: "Ruby conf ticket to employee x",
      expense_category_id: @conference_category_india.id,
      vendor_id: @booking_vendor_india.id,
      expense_type: :business
    }
]

expenses.each do |expense|
  @saeloun_india.expenses.create(expense)
end

puts "Expenses Created"

# Expenses End
