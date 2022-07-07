# frozen_string_literal: true

class AddDefaultAddressTypeToAddresses < ActiveRecord::Migration[7.0]
  def change
    change_column :addresses, :address_type, :string, default: "current"
  end
end
