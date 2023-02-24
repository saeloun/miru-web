# frozen_string_literal: true

class RenameAddressColumnOfCompany < ActiveRecord::Migration[7.0]
  def change
    safety_assured { rename_column :companies, :address, :old_address }
    change_column_null :companies, :old_address, true
  end
end
