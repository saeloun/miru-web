# frozen_string_literal: true

class CreateHiringOffers < ActiveRecord::Migration[8.1]
  def up
    create_table :hiring_offers do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :issued_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.uuid :request_key, null: false
      t.text :request_details, null: false
      t.text :edit_details
      t.text :issue_details
      t.text :response_details
      t.text :details, null: false
      t.text :access_token, null: false
      t.string :state, null: false, default: "preparing"
      t.datetime :issued_at
      t.datetime :expires_at
      t.datetime :responded_at
      t.datetime :revoked_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index :access_token, unique: true
      t.index [:company_id, :id], unique: true
      t.index [:company_id, :request_key], unique: true
      t.index [:company_id, :hiring_application_id], unique: true, where: "state IN ('preparing', 'sent', 'accepted')", name: "index_hiring_offers_one_active"
      t.index [:company_id, :hiring_application_id, :id], name: "index_hiring_offers_for_history"
      t.index :expires_at, where: "state = 'sent'", name: "index_hiring_offers_pending_expiry"
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id], on_delete: :cascade
      t.check_constraint "(state = 'preparing' AND issued_at IS NULL AND issued_by_id IS NULL AND issue_details IS NULL AND expires_at IS NULL AND responded_at IS NULL AND response_details IS NULL AND revoked_at IS NULL) OR " \
        "(state IN ('sent', 'accepted', 'declined', 'expired') AND issued_at IS NOT NULL AND issue_details IS NOT NULL AND expires_at IS NOT NULL AND " \
        "((state IN ('sent', 'expired') AND responded_at IS NULL AND response_details IS NULL) OR (state IN ('accepted', 'declined') AND responded_at IS NOT NULL AND response_details IS NOT NULL)))", name: "hiring_offer_state"
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Preserve recorded hiring offers before rolling back." if select_value("SELECT EXISTS (SELECT 1 FROM hiring_offers)")

    drop_table :hiring_offers
  end
end
