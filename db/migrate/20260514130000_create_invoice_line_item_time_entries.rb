# frozen_string_literal: true

class CreateInvoiceLineItemTimeEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :invoice_line_item_time_entries do |t|
      t.references :invoice_line_item, null: false, foreign_key: true, index: { name: "idx_line_item_time_entries_on_invoice_line_item_id" }
      t.references :timesheet_entry, null: false, foreign_key: true, index: { name: "idx_line_item_time_entries_on_timesheet_entry_id" }

      t.timestamps
    end

    add_index :invoice_line_item_time_entries,
      [:invoice_line_item_id, :timesheet_entry_id],
      unique: true,
      name: "idx_line_item_time_entries_unique_pair"
  end
end
