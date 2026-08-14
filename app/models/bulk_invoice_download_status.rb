# frozen_string_literal: true

class BulkInvoiceDownloadStatus < ApplicationRecord
  belongs_to :company, optional: true

  validates :download_id, presence: true, uniqueness: { scope: :company_id }
  validates :status, presence: true
  validates :file_url, presence: true, allow_nil: true
end
