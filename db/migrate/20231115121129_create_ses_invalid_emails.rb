# frozen_string_literal: true

class CreateSesInvalidEmails < ActiveRecord::Migration[7.0]
  def change
    create_table :ses_invalid_emails do |t|
      t.string :email
      t.boolean :bounce, default: false
      t.boolean :compliant, default: false

      t.timestamps
    end
  end
end
