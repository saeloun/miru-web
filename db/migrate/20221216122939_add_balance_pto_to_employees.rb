# frozen_string_literal: true

class AddBalancePtoToEmployees < ActiveRecord::Migration[7.0]
  def change
    add_column :employments, :balance_pto, :integer, default: 0, null: false
  end
end
