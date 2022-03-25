# frozen_string_literal: true

class AddNotNullToClientCode < ActiveRecord::Migration[7.0]
  def change
    change_column_null :clients, :client_code, false
  end
end
