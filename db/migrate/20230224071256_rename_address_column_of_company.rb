class RenameAddressColumnOfCompany < ActiveRecord::Migration[7.0]
  def change
    safety_assured { rename_column :companies, :address, :old_address }
  end
end
