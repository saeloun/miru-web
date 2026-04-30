# frozen_string_literal: true

class AddAnalyticsAggregationIndexes < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def up
    add_index :invoices, [:company_id, :issue_date, :status], algorithm: :concurrently,
      name: "index_invoices_on_company_issue_date_status" unless index_exists?(:invoices, [:company_id, :issue_date, :status], name: "index_invoices_on_company_issue_date_status")
    add_index :invoices, [:client_id, :issue_date, :status], algorithm: :concurrently,
      name: "index_invoices_on_client_issue_date_status" unless index_exists?(:invoices, [:client_id, :issue_date, :status], name: "index_invoices_on_client_issue_date_status")
    add_index :payments, [:invoice_id, :transaction_date, :status], algorithm: :concurrently,
      name: "index_payments_on_invoice_transaction_date_status" unless index_exists?(:payments, [:invoice_id, :transaction_date, :status], name: "index_payments_on_invoice_transaction_date_status")
    add_index :timesheet_entries, [:user_id, :work_date, :bill_status], algorithm: :concurrently,
      name: "index_timesheet_entries_on_user_work_date_bill_status" unless index_exists?(:timesheet_entries, [:user_id, :work_date, :bill_status], name: "index_timesheet_entries_on_user_work_date_bill_status")
    add_index :timesheet_entries, [:project_id, :work_date], algorithm: :concurrently,
      name: "index_timesheet_entries_on_project_work_date" unless index_exists?(:timesheet_entries, [:project_id, :work_date], name: "index_timesheet_entries_on_project_work_date")
    add_index :invoice_line_items, [:timesheet_entry_id, :date], algorithm: :concurrently,
      name: "index_invoice_line_items_on_timesheet_entry_date" unless index_exists?(:invoice_line_items, [:timesheet_entry_id, :date], name: "index_invoice_line_items_on_timesheet_entry_date")
    add_index :expenses, [:company_id, :date, :expense_category_id], algorithm: :concurrently,
      name: "index_expenses_on_company_date_category" unless index_exists?(:expenses, [:company_id, :date, :expense_category_id], name: "index_expenses_on_company_date_category")
  end

  def down
    remove_index :invoices, name: "index_invoices_on_company_issue_date_status" if index_exists?(:invoices, name: "index_invoices_on_company_issue_date_status")
    remove_index :invoices, name: "index_invoices_on_client_issue_date_status" if index_exists?(:invoices, name: "index_invoices_on_client_issue_date_status")
    remove_index :payments, name: "index_payments_on_invoice_transaction_date_status" if index_exists?(:payments, name: "index_payments_on_invoice_transaction_date_status")
    remove_index :timesheet_entries, name: "index_timesheet_entries_on_user_work_date_bill_status" if index_exists?(:timesheet_entries, name: "index_timesheet_entries_on_user_work_date_bill_status")
    remove_index :timesheet_entries, name: "index_timesheet_entries_on_project_work_date" if index_exists?(:timesheet_entries, name: "index_timesheet_entries_on_project_work_date")
    remove_index :invoice_line_items, name: "index_invoice_line_items_on_timesheet_entry_date" if index_exists?(:invoice_line_items, name: "index_invoice_line_items_on_timesheet_entry_date")
    remove_index :expenses, name: "index_expenses_on_company_date_category" if index_exists?(:expenses, name: "index_expenses_on_company_date_category")
  end
end
