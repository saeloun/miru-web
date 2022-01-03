# frozen_string_literal: true

class AddCompanyIdToUser < ActiveRecord::Migration[7.0]
  def up
    add_column :users, :company_id, :integer
  end

  def down
    remove_column :users, :company_id, :integer
  end
end
