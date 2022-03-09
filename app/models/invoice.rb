# == Schema Information
#
# Table name: invoices
#
#  id                 :integer          not null, primary key
#  issue_date         :date
#  due_date           :date
#  invoice_number     :string
#  reference          :text
#  amount             :float
#  outstanding_amount :float
#  sub_total          :float
#  tax                :float
#  amount_paid        :float
#  amount_due         :float
#  company_id         :integer          not null
#  client_id          :integer          not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_invoices_on_client_id                 (client_id)
#  index_invoices_on_company_id                (company_id)
#  index_invoices_on_company_id_and_client_id  (company_id,client_id) UNIQUE
#

# frozen_string_literal: true

class Invoice < ApplicationRecord
  belongs_to :company
  belongs_to :client
  has_many :invoice_line_items

  validates :issue_date, :due_date, :invoice_number, presence: true
  validates :due_date, comparison: { greater_than_or_equal_to: :issue_date }
  validates :amount, :outstanding_amount, :sub_total, :tax,
    :amount_paid, :amount_due, numericality: { greater_than_or_equal_to: 0 }
  validates :invoice_number, uniqueness: true
end
