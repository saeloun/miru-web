# frozen_string_literal: true

class CreateAddresses < ActiveRecord::Migration[7.0]
  def change
    create_table :addresses do |t|
      t.references :addressable, polymorphic: true
      t.string :address_type
      t.string :address_line_1, null: false
      t.string :address_line_2
      t.string :city, null: false
      t.string :country, null: false
      t.string :pin, null: false
      t.index [ :addressable_type, :addressable_id, :address_type ], unique: true, name: "index_addresses_on_addressable_and_address_type"

      t.timestamps
    end
  end
end
