# frozen_string_literal: true

class AddStripeIdToClients < ActiveRecord::Migration[7.0]
  def change
    add_column :clients, :stripe_id, :string, default: nil
  end
end
