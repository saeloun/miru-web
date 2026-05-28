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

  validates :miru_record_type,
    :miru_record_id,
    :quickbooks_entity_type,
    :quickbooks_entity_id,
    :direction,
    :status,
    presence: true
  validates :quickbooks_entity_type, :quickbooks_entity_id, length: { maximum: 100 }
  validates :quickbooks_sync_token, length: { maximum: 100 }, allow_blank: true
end
