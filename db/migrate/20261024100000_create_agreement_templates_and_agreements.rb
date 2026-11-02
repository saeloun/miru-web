# frozen_string_literal: true

class CreateAgreementTemplatesAndAgreements < ActiveRecord::Migration[8.1]
  def change
    create_table :agreement_templates do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false, limit: 200
      t.string :kind, null: false
      t.text :document, null: false
      t.text :fields, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_check_constraint :agreement_templates, "kind IN ('client', 'consultant')", name: "agreement_templates_kind"

    create_table :agreements do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :agreement_template, foreign_key: true
      t.integer :source_template_version
      t.references :client, foreign_key: true
      t.references :employment, foreign_key: true
      t.string :title, null: false, limit: 200
      t.string :kind, null: false
      t.string :status, null: false, default: "draft"
      t.text :document, null: false
      t.text :fields, null: false
      t.text :field_values, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_check_constraint :agreements, "status = 'draft'", name: "agreements_status"
    add_check_constraint :agreements,
      "(kind = 'client' AND client_id IS NOT NULL AND employment_id IS NULL) OR " \
      "(kind = 'consultant' AND employment_id IS NOT NULL AND client_id IS NULL)", name: "agreements_counterparty"
    add_check_constraint :agreements,
      "(agreement_template_id IS NULL AND source_template_version IS NULL) OR " \
      "(agreement_template_id IS NOT NULL AND source_template_version IS NOT NULL AND source_template_version >= 0)",
      name: "agreements_source_version"
  end
end
