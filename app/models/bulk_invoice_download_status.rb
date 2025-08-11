# frozen_string_literal: true

# == Schema Information
#
# Table name: bulk_invoice_download_statuses
#
#  id          :integer          not null, primary key
#  download_id :string
#  status      :string
#  file_url    :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class BulkInvoiceDownloadStatus < ApplicationRecord
  validates :download_id, presence: true, uniqueness: true
  validates :status, presence: true
  validates :file_url, presence: true, allow_nil: true
end
