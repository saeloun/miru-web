# frozen_string_literal: true

class AddLimitToCompanyCode < ActiveRecord::Migration[7.0]
  def change
    change_column :companies, :company_code, :string, limit: 2
  end
end
