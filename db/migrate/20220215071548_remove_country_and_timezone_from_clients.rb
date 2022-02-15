# frozen_string_literal: true

class RemoveCountryAndTimezoneFromClients < ActiveRecord::Migration[7.0]
  def change
    remove_column :clients, :country, :string
    remove_column :clients, :timezone, :string
  end
end
