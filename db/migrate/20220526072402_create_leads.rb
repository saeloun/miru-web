# frozen_string_literal: true

class CreateLeads < ActiveRecord::Migration[7.0]
  def change
    create_table :leads do |t|
      t.string :name
      t.string :primary_email
      t.string :other_email
      t.text :address
      t.string :mobilephone
      t.string :telephone
      t.string :skypeid
      t.string :linkedinid
      t.string :timezone
      t.string :country
      t.string :description
      t.boolean :donotbulkemail, default: false
      t.boolean :donotemail, default: false
      t.boolean :donotfax, default: false
      t.boolean :donotphone, default: false
      t.integer :quality_code
      t.integer :priority
      t.integer :state_code
      t.integer :industry_code
      t.datetime :discarded_at
      t.string :base_currency, default: "USD"
      t.decimal :budget_amount, default: 0
      t.integer :budget_status_code
      t.integer :status_code

      t.timestamps
    end
    add_index :leads, :discarded_at
  end
end
