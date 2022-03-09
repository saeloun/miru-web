# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_line_item do
    name { "MyString" }
    description { "MyText" }
    date { "2022-03-09" }
    rate { 1.5 }
    quantity { 1 }
    user
    invoice
    timesheet_entry
  end
end
