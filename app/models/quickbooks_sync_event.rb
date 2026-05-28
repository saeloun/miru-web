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

  validates :source,
    :quickbooks_entity_type,
    :quickbooks_entity_id,
    :status,
    presence: true
  validates :quickbooks_entity_type, :quickbooks_entity_id, length: { maximum: 100 }
end
