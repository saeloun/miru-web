# frozen_string_literal: true

class ChangeColumnNameInDevices < ActiveRecord::Migration[7.0]
  def change
    rename_column :devices, :model, :name
  end
end
