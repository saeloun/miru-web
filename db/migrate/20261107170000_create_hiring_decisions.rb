# frozen_string_literal: true

class CreateHiringDecisions < ActiveRecord::Migration[8.1]
  def up
    create_table :hiring_decisions do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :finalized_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.uuid :request_key, null: false
      t.text :request_details, null: false
      t.text :edit_details
      t.text :finalization_details
      t.text :details, null: false
      t.string :state, null: false, default: "draft"
      t.datetime :finalized_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :id], unique: true
      t.index [:company_id, :request_key], unique: true
      t.index [:company_id, :hiring_application_id], unique: true, where: "state = 'draft'", name: "index_hiring_decisions_one_draft"
      t.index [:company_id, :hiring_application_id, :id], name: "index_hiring_decisions_for_history"
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id], on_delete: :cascade
      t.check_constraint "(state = 'draft' AND finalized_at IS NULL AND finalized_by_id IS NULL AND finalization_details IS NULL) OR " \
        "(state = 'finalized' AND finalized_at IS NOT NULL AND finalization_details IS NOT NULL)", name: "hiring_decision_state"
    end
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_decisions)")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded hiring decisions before rolling back."
    end

    drop_table :hiring_decisions
  end
end
