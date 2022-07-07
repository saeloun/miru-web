# frozen_string_literal: true

class AddPhoneNumberToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :phone, :string
  end
end
