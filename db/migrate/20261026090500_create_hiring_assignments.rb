# frozen_string_literal: true

class CreateHiringAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_assignments do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :template_revision, null: false, index: false
      t.references :reviewer_employment, foreign_key: { to_table: :employments, on_delete: :nullify }
      t.references :issued_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :previous_assignment, foreign_key: { to_table: :hiring_assignments, on_delete: :nullify }
      t.uuid :request_key, null: false
      t.text :request_details, null: false
      t.text :terms, null: false
      t.text :candidate_note
      t.text :access_token, null: false
      t.datetime :due_at, null: false
      t.datetime :ended_at
      t.string :status, null: false, default: "issued"
      t.integer :review_round, null: false, default: 0
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :id], unique: true
      t.index [:company_id, :request_key], unique: true
      t.index :access_token, unique: true
      t.index [:company_id, :hiring_application_id, :id], name: "index_hiring_assignments_for_history"
      t.index [:company_id, :hiring_application_id], unique: true, where: "ended_at IS NULL", name: "index_hiring_assignments_one_active"
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.foreign_key :hiring_assignment_template_revisions, column: [:company_id, :template_revision_id], primary_key: [:company_id, :id]
      t.check_constraint "(status IN ('issued', 'submitted', 'reviewed') AND ended_at IS NULL) OR " \
        "(status IN ('completed', 'cancelled', 'superseded') AND ended_at IS NOT NULL)", name: "hiring_assignment_status"
    end

    create_table :hiring_assignment_submissions do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_assignment, null: false, index: { unique: true }
      t.text :answers, null: false
      t.datetime :submitted_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :hiring_assignment_id, :id], unique: true, name: "index_hiring_work_for_tenant_assignment"
      t.foreign_key :hiring_assignments, column: [:company_id, :hiring_assignment_id], primary_key: [:company_id, :id]
    end

    create_table :hiring_assignment_reviews do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_assignment, null: false, index: false
      t.references :submission, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :assignment_version, null: false
      t.integer :review_round, null: false
      t.string :outcome, null: false
      t.text :details, null: false
      t.timestamps
      t.index [:hiring_assignment_id, :assignment_version], unique: true, name: "index_hiring_assessment_reviews_per_version"
      t.foreign_key :hiring_assignments, column: [:company_id, :hiring_assignment_id], primary_key: [:company_id, :id]
      t.foreign_key :hiring_assignment_submissions, column: [:company_id, :hiring_assignment_id, :submission_id],
        primary_key: [:company_id, :hiring_assignment_id, :id]
    end

    create_table :hiring_assignment_events do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_assignment, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :assignment_version, null: false
      t.string :action, null: false
      t.text :details, null: false
      t.timestamps
      t.index [:hiring_assignment_id, :assignment_version], unique: true, name: "index_hiring_assignment_events_per_version"
      t.foreign_key :hiring_assignments, column: [:company_id, :hiring_assignment_id], primary_key: [:company_id, :id]
    end
  end
end
