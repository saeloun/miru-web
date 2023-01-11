# frozen_string_literal: true

class CreateVendors < ActiveRecord::Migration[7.0]
  def change
    create_table :vendors do |t|
      t.string :name

      t.timestamps
    end
  end
end
