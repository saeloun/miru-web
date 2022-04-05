# frozen_string_literal: true

class MakeCompanyCodeUnique < ActiveRecord::Migration[7.0]
  def change
    add_index :companies, :company_code, unique: true
  end
end
