# frozen_string_literal: true

class AddEinToClients < ActiveRecord::Migration[7.2]
  def change
    add_column :clients, :ein, :string
  end
end
