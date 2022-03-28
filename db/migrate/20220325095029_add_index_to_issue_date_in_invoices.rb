# frozen_string_literal: true

class AddIndexToIssueDateInInvoices < ActiveRecord::Migration[7.0]
  def change
    add_index :invoices, :issue_date, if_not_exists: true
  end
end
