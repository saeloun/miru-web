# frozen_string_literal: true

class EnablePostgresqlSearchExtensions < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    # Enable PostgreSQL extensions for better search capabilities
    enable_extension "pg_trgm"  # For fuzzy matching and similarity search
    enable_extension "unaccent" # For accent-insensitive search

    # Add GIN indexes for trigram search on commonly searched columns
    # These significantly improve search performance
    # Using algorithm: :concurrently to avoid blocking writes

    # Users
    add_index :users, :first_name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_users_on_first_name_trgm", algorithm: :concurrently
    add_index :users, :last_name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_users_on_last_name_trgm", algorithm: :concurrently
    add_index :users, :email, using: :gin, opclass: :gin_trgm_ops,
              name: "index_users_on_email_trgm", algorithm: :concurrently, if_not_exists: true

    # Clients
    add_index :clients, :name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_clients_on_name_trgm", algorithm: :concurrently
    add_index :clients, :email, using: :gin, opclass: :gin_trgm_ops,
              name: "index_clients_on_email_trgm", algorithm: :concurrently, if_not_exists: true

    # Projects
    add_index :projects, :name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_projects_on_name_trgm", algorithm: :concurrently
    add_index :projects, :description, using: :gin, opclass: :gin_trgm_ops,
              name: "index_projects_on_description_trgm", algorithm: :concurrently

    # Invoices
    add_index :invoices, :invoice_number, using: :gin, opclass: :gin_trgm_ops,
              name: "index_invoices_on_invoice_number_trgm", algorithm: :concurrently

    # Timesheet entries
    add_index :timesheet_entries, :note, using: :gin, opclass: :gin_trgm_ops,
              name: "index_timesheet_entries_on_note_trgm", algorithm: :concurrently

    # Expenses
    add_index :expenses, :description, using: :gin, opclass: :gin_trgm_ops,
              name: "index_expenses_on_description_trgm", algorithm: :concurrently

    # Invitations
    add_index :invitations, :first_name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_invitations_on_first_name_trgm", algorithm: :concurrently
    add_index :invitations, :last_name, using: :gin, opclass: :gin_trgm_ops,
              name: "index_invitations_on_last_name_trgm", algorithm: :concurrently
    add_index :invitations, :recipient_email, using: :gin, opclass: :gin_trgm_ops,
              name: "index_invitations_on_recipient_email_trgm", algorithm: :concurrently
  end
end
