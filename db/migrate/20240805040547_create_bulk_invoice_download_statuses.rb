# frozen_string_literal: true

class CreateBulkInvoiceDownloadStatuses < ActiveRecord::Migration[7.1]
  def change
    create_table :bulk_invoice_download_statuses do |t|
      t.string :download_id
      t.string :status
      t.string :file_url

      t.timestamps
    end
  end
end
