# frozen_string_literal: true

class BulkInvoiceDownloadStatus < ApplicationRecord
  validates :download_id, presence: true, uniqueness: true
  validates :status, presence: true
  validates :file_url, presence: true, allow_nil: true
end
