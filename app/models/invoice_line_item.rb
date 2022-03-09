# == Schema Information
#
# Table name: invoice_line_items
#
#  id                 :integer          not null, primary key
#  name               :string
#  description        :text
#  date               :date
#  rate               :float
#  quantity           :integer
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

  validates :name, :description, :date, :rate, :quantity, presence: true
  validates :rate, :quantity, numericality: { greater_than_or_equal_to: 0 }
end
