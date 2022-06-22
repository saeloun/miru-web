# frozen_string_literal: true

class AddStateFieldToAddresses < ActiveRecord::Migration[7.0]
  def change
    add_column :addresses, :state, :string, null: false
  end
end
