# frozen_string_literal: true

class RemoveCompanyAndClientCode < ActiveRecord::Migration[7.0]
  def change
    remove_column :clients, :client_code
    remove_column :companies, :company_code
  end
end
