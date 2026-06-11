# frozen_string_literal: true

class QuickbooksReference < ApplicationRecord
  enum :direction, {
    miru_to_quickbooks: 0,
    quickbooks_to_miru: 1,
    bidirectional: 2
  }

  enum :status, {
    pending: 0,
    synced: 1,
    failed: 2,
    conflict: 3,
    ignored: 4
  }

  belongs_to :company
  belongs_to :quickbooks_connection
  belongs_to :miru_record, polymorphic: true

  validate :company_matches_quickbooks_connection
  validate :company_matches_miru_record

  validates :miru_record_type,
    :miru_record_id,
    :quickbooks_entity_type,
    :quickbooks_entity_id,
    :direction,
    :status,
    presence: true
  validates :quickbooks_entity_type, :quickbooks_entity_id, length: { maximum: 100 }
  validates :quickbooks_sync_token, length: { maximum: 100 }, allow_blank: true

  private

    def company_matches_quickbooks_connection
      return if company.blank? || quickbooks_connection.blank?
      return if quickbooks_connection.company_id == company_id

      errors.add(:quickbooks_connection, "must belong to the same company")
    end

    def company_matches_miru_record
      return if company.blank? || miru_record.blank?
      return unless miru_record.respond_to?(:company_id)
      return if miru_record.company_id == company_id

      errors.add(:miru_record, "must belong to the same company")
    end
end
