# frozen_string_literal: true

class RemoveUserIdFromInvoiceLineItems < ActiveRecord::Migration[7.0]
  def change
    remove_column :invoice_line_items, :user_id, :integer
  end
end
