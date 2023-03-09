# frozen_string_literal: true

class ChangeClientAddressToNull < ActiveRecord::Migration[7.0]
  def change
    change_column_null :clients, :address, true
  end
end
