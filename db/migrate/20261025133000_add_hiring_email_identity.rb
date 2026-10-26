# frozen_string_literal: true

class AddHiringEmailIdentity < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :hiring_applications, :email_key, :string, limit: 64
    add_index :hiring_applications, [:company_id, :email_key], unique: true,
      where: "email_key IS NOT NULL", algorithm: :concurrently
    add_index :hiring_applications, [:company_id, :id], unique: true, algorithm: :concurrently
    add_check_constraint :hiring_applications,
      "(source = 'manual' AND email_key IS NULL) OR (source = 'email' AND email_key ~ '^[a-f0-9]{64}$')",
      name: "hiring_application_supported_source", validate: false
    validate_check_constraint :hiring_applications, name: "hiring_application_supported_source"
    remove_check_constraint :hiring_applications, "source = 'manual'", name: "hiring_application_source"
  end
end
