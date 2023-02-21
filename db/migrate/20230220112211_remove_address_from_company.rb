class RemoveAddressFromCompany < ActiveRecord::Migration[7.0]
  def change
    safety_assured { remove_column :companies, :address }
  end
end
