# frozen_string_literal: true

class RemoveCompanyRefFromInvoices < ActiveRecord::Migration[7.0]
  def change
    remove_reference :invoices, :company, null: false, foreign_key: true
  end
end
