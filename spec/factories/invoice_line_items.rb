# frozen_string_literal: true

# == Schema Information
#
# Table name: invoice_line_items
#
#  id                 :bigint           not null, primary key
#  date               :date
#  description        :text
#  name               :string
#  quantity           :integer          default(1)
#  rate               :decimal(20, 2)   default(0.0)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  invoice_id         :bigint           not null
#  timesheet_entry_id :bigint
#
# Indexes
#
#  index_invoice_line_items_on_invoice_id          (invoice_id)
#  index_invoice_line_items_on_timesheet_entry_id  (timesheet_entry_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#  fk_rails_...  (timesheet_entry_id => timesheet_entries.id)
#
FactoryBot.define do
  factory :invoice_line_item do
    name { Faker::Name.name }
    description { Faker::Alphanumeric.alpha(number: 20) }
    date { Faker::Date.between(from: "2022-04-01", to: Date.today) }
    rate { Faker::Number.between(from: 0, to: 1000) }
    quantity { Faker::Number.between(from: 1, to: 10) }
    invoice
    timesheet_entry
  end
end
