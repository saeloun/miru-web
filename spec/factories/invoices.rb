# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    issue_date { "2022-03-09" }
    due_date { "2022-03-09" }
    invoice_number { "MyString" }
    reference { "MyText" }
    amount { 1.5 }
    outstanding_amount { 1.5 }
    sub_total { 1.5 }
    tax { 1.5 }
    amount_paid { 1.5 }
    amount_due { 1.5 }
    company { 1 }
    client { 1 }
  end
end
