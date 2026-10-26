# frozen_string_literal: true

class CreateHiringIntake < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_candidates do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.string :full_name, null: false, limit: 200
      t.string :email, null: false, limit: 254
      t.timestamps
    end
    add_index :hiring_candidates, [:company_id, :email], unique: true
    add_index :hiring_candidates, [:company_id, :id], unique: true
    add_check_constraint :hiring_candidates, "email = lower(btrim(email))", name: "hiring_candidate_normalized_email"

    create_table :hiring_roles do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.string :title, null: false, limit: 200
      t.string :status, null: false, default: "open"
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :hiring_roles, [:company_id, :id], unique: true
    add_check_constraint :hiring_roles, "status IN ('open', 'closed')", name: "hiring_role_status"

    create_table :hiring_applications do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_candidate, null: false, index: false
      t.references :hiring_role, index: false
      t.references :owner_employment, foreign_key: { to_table: :employments, on_delete: :nullify }
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.uuid :request_key, null: false
      t.text :creation_details, null: false
      t.text :notes
      t.string :source, null: false, default: "manual"
      t.string :stage, null: false, default: "received"
      t.datetime :received_at, null: false
      t.integer :lock_version, null: false, default: 0
      t.foreign_key :hiring_candidates, column: [:company_id, :hiring_candidate_id], primary_key: [:company_id, :id]
      t.foreign_key :hiring_roles, column: [:company_id, :hiring_role_id], primary_key: [:company_id, :id]
      t.timestamps
    end
    add_index :hiring_applications, [:company_id, :request_key], unique: true
    add_index :hiring_applications, [:company_id, :received_at, :id], name: "index_hiring_applications_for_pipeline"
    add_index :hiring_applications, [:hiring_candidate_id, :received_at, :id], name: "index_hiring_applications_for_candidate"
    add_check_constraint :hiring_applications, "source = 'manual'", name: "hiring_application_source"
    add_check_constraint :hiring_applications,
      "stage IN ('received', 'information_pending', 'screening', 'shortlisted', 'assignment_assigned', 'assignment_review', " \
      "'interview', 'final_decision', 'offer', 'hired', 'on_hold', 'rejection_pending', 'rejected', 'withdrawn', 'no_show')",
      name: "hiring_application_stage"
  end
end
