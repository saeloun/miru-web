# frozen_string_literal: true

class QuickbooksSyncEvent < ApplicationRecord
  enum :source, {
    webhook: 0,
    cdc: 1,
    manual: 2,
    local_change: 3
  }, prefix: true

  enum :status, {
    pending: 0,
    processed: 1,
    ignored: 2,
    failed: 3,
    conflict: 4
  }

  belongs_to :company
  belongs_to :quickbooks_connection
  belongs_to :quickbooks_sync_run, optional: true

  validate :company_matches_quickbooks_connection
  validate :company_matches_sync_run

  validates :source,
    :quickbooks_entity_type,
    :quickbooks_entity_id,
    :payload_digest,
    :status,
    presence: true
  validates :quickbooks_entity_type, :quickbooks_entity_id, length: { maximum: 100 }

  private

    def company_matches_quickbooks_connection
      return if company.blank? || quickbooks_connection.blank?
      return if quickbooks_connection.company_id == company_id

      errors.add(:quickbooks_connection, "must belong to the same company")
    end

    def company_matches_sync_run
      return if company.blank? || quickbooks_sync_run.blank?

      if quickbooks_sync_run.company_id != company_id
        errors.add(:quickbooks_sync_run, "must belong to the same company")
      end

      return if quickbooks_connection.blank?
      return if quickbooks_sync_run.quickbooks_connection_id == quickbooks_connection_id

      errors.add(:quickbooks_sync_run, "must belong to the same QuickBooks connection")
    end
end
