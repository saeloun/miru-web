# frozen_string_literal: true

class RemoveUniqueFromClientCode < ActiveRecord::Migration[7.0]
  def change
    remove_index :clients, :client_code
  end
end
