# frozen_string_literal: true

class AddMissingIndexes < ActiveRecord::Migration[7.0]
  def change
    add_index :devices, :device_type

    add_index :identities, :provider

    add_index :invitations, :recipient_email
    add_index :invitations, :expired_at
    add_index :invitations, :accepted_at
    add_index :invitations, :role

    add_index :invoices, :due_date

    add_index :payments, :status

    add_index :payments_providers, :connected
    add_index :payments_providers, :enabled

    add_index :projects, :billable

    add_index :timesheet_entries, :bill_status

    add_index :users, :confirmation_token
  end
end
