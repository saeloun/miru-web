# frozen_string_literal: true

class AddSignatureArchivesAndCallbacks < ActiveRecord::Migration[8.1]
  def change
    add_column :signature_request_revisions, :artifact_manifest, :text
    add_column :signature_request_revisions, :archived_at, :datetime
    add_column :signature_request_revisions, :archive_error, :string

    create_table :signature_callbacks do |t|
      t.references :revision, null: false, foreign_key: { to_table: :signature_request_revisions }
      t.string :digest, null: false, limit: 64
      t.string :event, null: false, limit: 40
      t.datetime :enqueued_at
      t.datetime :processed_at
      t.timestamps
    end
    add_index :signature_callbacks, [:revision_id, :digest], unique: true
  end
end
