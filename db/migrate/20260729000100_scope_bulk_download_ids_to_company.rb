# frozen_string_literal: true

class ScopeBulkDownloadIdsToCompany < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :bulk_invoice_download_statuses,
      [:company_id, :download_id],
      unique: true,
      algorithm: :concurrently
  end
end
