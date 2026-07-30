# frozen_string_literal: true

class AddProviderEventIdToPayments < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :payments, :provider_event_id, :string
    add_index :payments, :provider_event_id, unique: true, algorithm: :concurrently
  end
end
