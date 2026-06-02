# frozen_string_literal: true

class QuickbooksSyncRun < ApplicationRecord
  enum :direction, {
    miru_to_quickbooks: 0,
    quickbooks_to_miru: 1,
    bidirectional: 2
  }

  enum :trigger, {
    manual: 0,
    invoice_event: 1,
    payment_event: 2,
    webhook: 3,
    cdc: 4,
    scheduled: 5
  }, prefix: true

  enum :status, {
    queued: 0,
    running: 1,
    succeeded: 2,
    failed: 3,
    partial: 4
  }

  belongs_to :company
  belongs_to :quickbooks_connection
  has_many :quickbooks_sync_events, dependent: :nullify

  before_validation :ensure_summary

  validate :company_matches_quickbooks_connection

  validates :direction, :trigger, :status, presence: true

  private

    def ensure_summary
      self.summary ||= {}
    end

    def company_matches_quickbooks_connection
      return if company.blank? || quickbooks_connection.blank?
      return if quickbooks_connection.company_id == company_id

      errors.add(:quickbooks_connection, "must belong to the same company")
    end
end
