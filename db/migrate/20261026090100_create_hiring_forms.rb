# frozen_string_literal: true

class CreateHiringForms < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_portal_accesses do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :hiring_setting, null: false, foreign_key: true
      t.references :issued_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :approved_setting_version, null: false
      t.text :access_token, null: false
      t.text :form_schema, null: false
      t.text :introduction, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.timestamps
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.foreign_key :hiring_settings, column: [:company_id, :hiring_setting_id], primary_key: [:company_id, :id]
      t.index :access_token, unique: true
      t.index [:company_id, :hiring_application_id]
      t.index [:company_id, :hiring_application_id, :id], unique: true, name: "index_hiring_portal_accesses_for_submission"
    end

    create_table :hiring_submissions do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :hiring_portal_access, null: false, index: { unique: true }
      t.text :answers, null: false
      t.datetime :submitted_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.foreign_key :hiring_portal_accesses, column: [:company_id, :hiring_application_id, :hiring_portal_access_id],
        primary_key: [:company_id, :hiring_application_id, :id], name: "fk_hiring_submission_application_access"
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.index [:company_id, :hiring_application_id]
    end
  end
end
