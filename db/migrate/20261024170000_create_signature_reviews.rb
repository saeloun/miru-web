# frozen_string_literal: true

class CreateSignatureReviews < ActiveRecord::Migration[8.1]
  def change
    add_column :signature_request_revisions, :approval_digest, :string, limit: 64
    add_column :signature_request_revisions, :approval_source, :string
    add_column :signature_request_revisions, :approval_note, :text

    create_table :signature_review_invitations do |t|
      t.references :revision, null: false, foreign_key: { to_table: :signature_request_revisions }
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :recipient_id, null: false, limit: 64
      t.text :access_token, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.string :decision
      t.datetime :decided_at
      t.string :email_status, null: false, default: "queued"
      t.datetime :email_sent_at
      t.timestamps
    end
    add_index :signature_review_invitations, :access_token, unique: true
    add_index :signature_review_invitations, [:revision_id, :recipient_id], unique: true,
      where: "revoked_at IS NULL", name: "signature_review_invitations_active_recipient"
    add_check_constraint :signature_review_invitations, "decision IS NULL OR decision IN ('approved', 'changes_requested')",
      name: "signature_review_invitations_decision"
    add_check_constraint :signature_review_invitations, "email_status IN ('queued', 'sent', 'failed')",
      name: "signature_review_invitations_email_status"

    create_table :signature_review_comments do |t|
      t.references :revision, null: false, foreign_key: { to_table: :signature_request_revisions }
      t.references :author_user, foreign_key: { to_table: :users }
      t.references :author_invitation, foreign_key: { to_table: :signature_review_invitations }
      t.text :body, null: false
      t.timestamps
    end
    add_check_constraint :signature_review_comments, "(author_user_id IS NULL) <> (author_invitation_id IS NULL)",
      name: "signature_review_comments_author"
  end
end
