# frozen_string_literal: true

class CreateCompanyUsers < ActiveRecord::Migration[7.0]
  def up
    create_table :company_users do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end

  def down
    drop_table :company_users
  end
end
