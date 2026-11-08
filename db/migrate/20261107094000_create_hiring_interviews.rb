# frozen_string_literal: true

class CreateHiringInterviews < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_interviews do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :previous_interview, foreign_key: { to_table: :hiring_interviews, on_delete: :nullify }
      t.integer :number, null: false
      t.uuid :request_key, null: false
      t.text :request_details, null: false
      t.text :details, null: false
      t.text :panel_snapshot, null: false
      t.string :status, null: false, default: "planned"
      t.datetime :ended_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :id], unique: true
      t.index [:hiring_application_id, :number], unique: true
      t.index [:hiring_application_id, :request_key], unique: true
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.check_constraint "number > 0", name: "hiring_interview_number"
      t.check_constraint "(status = 'planned' AND ended_at IS NULL) OR " \
        "(status IN ('completed', 'skipped', 'cancelled') AND ended_at IS NOT NULL)", name: "hiring_interview_status"
    end

    create_table :hiring_access_grants do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_interview, null: false, index: false
      t.references :hiring_panel_member, null: false, index: false
      t.references :granted_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.boolean :compensation_access, null: false, default: false
      t.datetime :revoked_at
      t.timestamps
      t.index [:hiring_interview_id, :hiring_panel_member_id], unique: true, where: "revoked_at IS NULL", name: "index_hiring_interview_active_grants"
      t.index [:company_id, :hiring_panel_member_id, :revoked_at], name: "index_hiring_grants_for_reviewer"
      t.foreign_key :hiring_interviews, column: [:company_id, :hiring_interview_id], primary_key: [:company_id, :id], on_delete: :cascade
      t.foreign_key :hiring_panel_members, column: [:company_id, :hiring_panel_member_id], primary_key: [:company_id, :id], on_delete: :cascade
    end

    create_table :hiring_interview_events do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_interview, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :interview_version, null: false
      t.integer :application_version, null: false
      t.string :action, null: false
      t.text :details, null: false
      t.timestamps
      t.index [:hiring_interview_id, :interview_version], unique: true, name: "index_hiring_interview_events_per_version"
      t.foreign_key :hiring_interviews, column: [:company_id, :hiring_interview_id], primary_key: [:company_id, :id], on_delete: :cascade
    end
  end
end
