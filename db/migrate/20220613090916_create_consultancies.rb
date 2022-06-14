# frozen_string_literal: true

class CreateConsultancies < ActiveRecord::Migration[7.0]
  def change
    create_table :consultancies do |t|
      t.string :name
      t.string :email
      t.string :phone
      t.string :address
      t.datetime :discarded_at

      t.index :discarded_at

      t.timestamps
    end

    create_table :candidates do |t|
      t.string :first_name
      t.string :last_name
      t.string :email
      t.references :consultancy
      t.datetime :discarded_at

      t.index :discarded_at

      t.timestamps
    end
  end
end
