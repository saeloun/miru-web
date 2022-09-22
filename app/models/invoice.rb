# == Schema Information
#
# Table name: invoices
#
#  id                 :bigint           not null, primary key
#  amount             :decimal(20, 2)   default(0.0)
#  amount_due         :decimal(20, 2)   default(0.0)
#  amount_paid        :decimal(20, 2)   default(0.0)
#  discount           :decimal(20, 2)   default(0.0)
#  due_date           :date
#  external_view_key  :string
#  invoice_number     :string
#  issue_date         :date
#  outstanding_amount :decimal(20, 2)   default(0.0)
#  payment_infos      :jsonb
#  reference          :text
#  status             :integer          default("draft"), not null
#  tax                :decimal(20, 2)   default(0.0)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  client_id          :bigint           not null
#
# Indexes
#
#  index_invoices_on_client_id          (client_id)
#  index_invoices_on_external_view_key  (external_view_key) UNIQUE
#  index_invoices_on_invoice_number     (invoice_number) UNIQUE
#  index_invoices_on_issue_date         (issue_date)
#  index_invoices_on_status             (status)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#

# frozen_string_literal: true

class Invoice < ApplicationRecord
  include InvoiceSendable
  require "securerandom"

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
  has_one :company, through: :client
  has_many :payments, dependent: :destroy
  accepts_nested_attributes_for :invoice_line_items, allow_destroy: true

  # Payment info details
  store_accessor :payment_infos, :stripe_payment_intent

  before_validation :set_external_view_key, on: :create

  validates :issue_date, :due_date, :invoice_number, presence: true
  validates :due_date, comparison: { greater_than_or_equal_to: :issue_date }
  validates :amount, :outstanding_amount, :tax,
    :amount_paid, :amount_due, :discount, numericality: { greater_than_or_equal_to: 0 }
  validates :invoice_number, uniqueness: true

  scope :with_statuses, -> (statuses) { where(status: statuses) if statuses.present? }
  scope :from_date, -> (from) { where("issue_date >= ?", from) if from.present? }
  scope :to_date, -> (to) { where("issue_date <= ?", to) if to.present? }
  scope :for_clients, -> (client_ids) { where(client_id: client_ids) if client_ids.present? }
  scope :search, -> (query) {
    where("invoice_number ILIKE :query OR clients.name ILIKE :query", query: "%#{query}%") if query.present?
  }
  scope :during, -> (duration) {
    where(due_date: duration)
  }

  delegate :name, to: :client, prefix: :client
  delegate :email, to: :client, prefix: :client

  def sub_total
    @_sub_total ||= invoice_line_items.sum { |line_item| line_item[:rate] * line_item[:quantity] }
  end

  def update_timesheet_entry_status!
    timesheet_entry_ids = invoice_line_items.pluck(:timesheet_entry_id)
    TimesheetEntry.where(id: timesheet_entry_ids).update!(bill_status: :billed)
  end

  def create_checkout_session!(success_url:, cancel_url:)
    InvoicePayment::Checkout.process(invoice: self, success_url:, cancel_url:, metadata: { invoice_id: self.id })
  end

  def unit_amount(base_currency)
    (amount * Money::Currency.new(base_currency).subunit_to_unit).to_i
  end

  private

    def set_external_view_key
      self.external_view_key = "#{SecureRandom.hex}"
    end
end
