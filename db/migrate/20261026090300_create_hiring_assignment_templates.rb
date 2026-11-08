# frozen_string_literal: true

class CreateHiringAssignmentTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_assignment_templates do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_role, index: false
      t.string :title, null: false
      t.string :skills, null: false, default: ""
      t.string :experience, null: false, default: ""
      t.string :status, null: false, default: "draft"
      t.text :details, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.foreign_key :hiring_roles, column: [:company_id, :hiring_role_id], primary_key: [:company_id, :id]
      t.index [:company_id, :id], unique: true
      t.index [:company_id, :title, :id], name: "index_hiring_assignment_templates_for_library"
      t.check_constraint "status IN ('draft', 'approved', 'archived')", name: "hiring_assignment_template_status"
    end

    create_table :hiring_assignment_template_revisions do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_assignment_template, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :template_version, null: false
      t.text :snapshot, null: false
      t.timestamps
      t.foreign_key :hiring_assignment_templates, column: [:company_id, :hiring_assignment_template_id], primary_key: [:company_id, :id]
      t.index [:hiring_assignment_template_id, :template_version], unique: true, name: "index_hiring_task_revisions_per_version"
    end
  end
end
