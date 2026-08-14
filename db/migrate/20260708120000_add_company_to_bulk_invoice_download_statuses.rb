# frozen_string_literal: true

class AddCompanyToBulkInvoiceDownloadStatuses < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :bulk_invoice_download_statuses, :company_id, :bigint
    add_index :bulk_invoice_download_statuses, :company_id, algorithm: :concurrently
  end
end
