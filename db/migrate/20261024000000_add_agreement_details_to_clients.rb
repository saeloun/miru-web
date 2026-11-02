# frozen_string_literal: true

class AddAgreementDetailsToClients < ActiveRecord::Migration[8.1]
  def change
    add_column :clients, :legal_name, :string, limit: 255
    add_column :clients, :signatory_name, :string, limit: 255
    add_column :clients, :signatory_designation, :string, limit: 255
    add_column :clients, :finance_email, :string, limit: 254
    add_column :clients, :signatory_email, :string, limit: 254
  end
end
