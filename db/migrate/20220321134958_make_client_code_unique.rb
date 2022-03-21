# frozen_string_literal: true

class MakeClientCodeUnique < ActiveRecord::Migration[7.0]
  def change
    add_index :clients, :client_code, unique: true
  end
end
