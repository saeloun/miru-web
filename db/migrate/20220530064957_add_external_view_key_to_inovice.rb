# frozen_string_literal: true

class AddExternalViewKeyToInovice < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :external_view_key, :string
  end
end
