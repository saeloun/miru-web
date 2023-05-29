# frozen_string_literal: true

class AddEmailsToClients < ActiveRecord::Migration[7.0]
  def change
    add_column :clients, :emails, :string, array: true, default: []
  end
end
