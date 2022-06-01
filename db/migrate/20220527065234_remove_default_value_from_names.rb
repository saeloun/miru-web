# frozen_string_literal: true

class RemoveDefaultValueFromNames < ActiveRecord::Migration[7.0]
  def change
    change_column_default :users, :first_name, nil
    change_column_default :users, :last_name, nil
  end
end
