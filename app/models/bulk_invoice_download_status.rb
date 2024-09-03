# frozen_string_literal: true

# == Schema Information
#
# Table name: bulk_invoice_download_statuses
#
#  id          :bigint           not null, primary key
#  file_url    :string
#  status      :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  download_id :string
#
class BulkInvoiceDownloadStatus < ApplicationRecord
  validates :download_id, presence: true, uniqueness: true
  validates :status, presence: true
  validates :file_url, presence: true, allow_nil: true
end
