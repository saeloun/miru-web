# frozen_string_literal: true

class CreateSignatureRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :signature_requests do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :client, foreign_key: true
      t.references :employment, foreign_key: true
      t.string :title, null: false, limit: 200
      t.string :creation_key, null: false, limit: 64
      t.string :creation_digest, null: false, limit: 64
      t.bigint :current_revision_id
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :signature_requests, [:company_id, :creation_key], unique: true
    add_check_constraint :signature_requests, "client_id IS NULL OR employment_id IS NULL", name: "signature_requests_party"

    create_table :signature_request_revisions do |t|
      t.references :signature_request, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :approved_by, foreign_key: { to_table: :users }
      t.integer :number, null: false
      t.string :title, null: false, limit: 200
      t.text :documents, null: false
      t.text :recipients, null: false
      t.text :fields, null: false
      t.string :content_digest, null: false, limit: 64
      t.string :status, null: false, default: "draft"
      t.datetime :approved_at
      t.string :provider_envelope_id
      t.string :operation_id
      t.datetime :send_started_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :signature_request_revisions, [:signature_request_id, :number], unique: true
    add_index :signature_request_revisions, :provider_envelope_id, unique: true
    add_index :signature_request_revisions, :operation_id, unique: true
    add_check_constraint :signature_request_revisions, "number > 0", name: "signature_request_revisions_number"
    add_check_constraint :signature_request_revisions,
      "status IN ('draft', 'under_review', 'changes_requested', 'approved', 'sending', 'send_uncertain', 'awaiting_signatures', 'signed', 'declined', 'cancelled', 'expired')",
      name: "signature_request_revisions_status"
    # Both tables are created empty in this transaction.
    safety_assured { add_foreign_key :signature_requests, :signature_request_revisions, column: :current_revision_id }
    add_index :signature_requests, :current_revision_id
  end
end
