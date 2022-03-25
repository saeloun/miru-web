# == Schema Information
#
# Table name: invoice_line_items
#
#  id                 :integer          not null, primary key
#  name               :string
#  description        :text
#  date               :date
#  rate               :decimal(20, 2)   default("0.0")
#  quantity           :integer          default("1")
#  user_id            :integer          not null
#  invoice_id         :integer          not null
#  timesheet_entry_id :integer
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_invoice_line_items_on_invoice_id          (invoice_id)
#  index_invoice_line_items_on_timesheet_entry_id  (timesheet_entry_id)
#  index_invoice_line_items_on_user_id             (user_id)
#

# frozen_string_literal: true

class InvoiceLineItem < ApplicationRecord
  belongs_to :user
  belongs_to :invoice
  belongs_to :timesheet_entry, optional: true

  validates :name, :date, :rate, :quantity, presence: true
  validates :rate, numericality: { greater_than_or_equal_to: 0 }
  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
end
