# frozen_string_literal: true

class AddVendorNameToExpenses < ActiveRecord::Migration[8.0]
  def change
    add_column :expenses, :vendor_name, :string
  end
end
