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
      t.string :country_code
      t.string :description
      t.boolean :donotbulkemail
      t.boolean :donotemail
      t.boolean :donotfax
      t.boolean :donotphone
      t.string :industry
      t.integer :quality_code
      t.integer :priority_code
      t.integer :state_code
      t.integer :industry_code

      t.timestamps
    end
  end
end
