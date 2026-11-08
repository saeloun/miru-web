# frozen_string_literal: true

class CreateHiringEmailIntake < ActiveRecord::Migration[8.1]
  def change
    create_table :action_mailbox_inbound_emails do |t|
      t.integer :status, default: 0, null: false
      t.string :message_id, null: false
      t.string :message_checksum, null: false
      t.timestamps
      t.index [:message_id, :message_checksum], unique: true, name: "index_action_mailbox_inbound_emails_uniqueness"
    end

    create_table :hiring_mailboxes do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.string :name, null: false, limit: 200
      t.string :source_email, null: false, limit: 254
      t.uuid :routing_key, null: false
      t.boolean :active, null: false, default: true
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index :routing_key, unique: true
      t.index [:company_id, :source_email], unique: true
      t.index [:company_id, :id], unique: true
      t.check_constraint "source_email = lower(btrim(source_email))", name: "hiring_mailbox_normalized_email"
    end

    create_table :hiring_receipts do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_mailbox, null: false, index: false
      t.references :inbound_email, foreign_key: { to_table: :action_mailbox_inbound_emails, on_delete: :nullify }
      t.references :hiring_application, index: false
      t.references :reviewed_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.datetime :reviewed_at
      t.datetime :received_at, null: false
      t.string :source_checksum, null: false, limit: 64
      t.string :message_key, limit: 64
      t.string :state, null: false, default: "pending"
      t.string :review_reason, limit: 64
      t.text :details, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.foreign_key :hiring_mailboxes, column: [:company_id, :hiring_mailbox_id], primary_key: [:company_id, :id]
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.index [:company_id, :hiring_mailbox_id, :source_checksum], unique: true, name: "index_hiring_receipts_on_mailbox_and_source"
      t.index [:company_id, :message_key]
      t.index [:company_id, :state, :received_at]
      t.index :hiring_application_id
      t.check_constraint "state IN ('pending', 'review', 'accepted', 'dismissed')", name: "hiring_receipt_state"
    end

    create_table :hiring_settings do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.references :approved_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.datetime :approved_at
      t.text :details, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end

    create_table :hiring_messages do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :hiring_setting, null: false, foreign_key: true
      t.references :queued_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :approved_setting_version, null: false
      t.string :kind, null: false, default: "acknowledgement"
      t.string :state, null: false, default: "queued"
      t.string :error_code, limit: 64
      t.text :content, null: false
      t.datetime :enqueued_at
      t.datetime :started_at
      t.datetime :sent_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.index [:company_id, :hiring_application_id, :kind], unique: true, name: "index_hiring_messages_on_application_event"
      t.index [:state, :enqueued_at]
      t.check_constraint "kind = 'acknowledgement'", name: "hiring_message_kind"
      t.check_constraint "state IN ('queued', 'sending', 'sent', 'failed', 'uncertain')", name: "hiring_message_state"
    end
  end
end
