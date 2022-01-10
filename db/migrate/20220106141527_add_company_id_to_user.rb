# frozen_string_literal: true

class AddCompanyIdToUser < ActiveRecord::Migration[7.0]
  def up
    add_reference :users, :company, foreign_key: true
  end

  def down
    remove_reference :users, :companies
  end
end
