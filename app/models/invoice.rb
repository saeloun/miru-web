# == Schema Information
#
# Table name: invoices
#
#  id                 :integer          not null, primary key
#  issue_date         :date
#  due_date           :date
#  invoice_number     :string
#  reference          :text
#  amount             :decimal(20, 2)   default("0.0")
#  outstanding_amount :decimal(20, 2)   default("0.0")
#  tax                :decimal(20, 2)   default("0.0")
#  amount_paid        :decimal(20, 2)   default("0.0")
#  amount_due         :decimal(20, 2)   default("0.0")
#  discount           :decimal(20, 2)   default("0.0")
#  status             :integer          default("0"), not null
#  client_id          :integer          not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_invoices_on_client_id       (client_id)
#  index_invoices_on_invoice_number  (invoice_number) UNIQUE
#  index_invoices_on_issue_date      (issue_date)
#  index_invoices_on_status          (status)
#

# frozen_string_literal: true

class Invoice < ApplicationRecord
  attr_accessor :sub_total

  enum status: [
    :draft,
    :sent,
    :viewed,
    :paid,
    :declined,
    :overdue
  ]

  belongs_to :client
  has_many :invoice_line_items, dependent: :destroy

  validates :issue_date, :due_date, :invoice_number, presence: true
  validates :due_date, comparison: { greater_than_or_equal_to: :issue_date }
  validates :amount, :outstanding_amount, :tax,
    :amount_paid, :amount_due, :discount, numericality: { greater_than_or_equal_to: 0 }
  validates :invoice_number, uniqueness: true

  scope :with_statuses, -> (statuses) { where(status: statuses) if statuses.present? }
  scope :from_date, -> (from) { where("issue_date >= ?", from) if from.present? }
  scope :to_date, -> (to) { where("issue_date <= ?", to) if to.present? }
  scope :for_clients, -> (client_ids) { where(client_id: client_ids) if client_ids.present? }

  delegate :name, to: :client, prefix: :client

  def sub_total
    @_sub_total ||= invoice_line_items.sum { |line_item| line_item[:rate] * line_item[:quantity] }
  end
end
