# frozen_string_literal: true

# This migration comes from solid_cable (originally 20240607184711)
class IndexChannels < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_index :solid_cable_messages, :channel, length: 500, algorithm: :concurrently
  end
end
