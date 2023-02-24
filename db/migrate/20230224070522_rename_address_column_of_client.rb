class RenameAddressColumnOfClient < ActiveRecord::Migration[7.0]
  def change
    safety_assured  { rename_column :clients, :address, :old_address }
  end
end
