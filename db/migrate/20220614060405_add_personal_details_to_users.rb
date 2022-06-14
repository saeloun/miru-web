# frozen_string_literal: true

class AddPersonalDetailsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :personal_email_id, :string
    add_column :users, :date_of_birth, :date
    add_column :users, :social_accounts, :jsonb
  end
end
