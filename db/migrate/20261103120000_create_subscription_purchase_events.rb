# frozen_string_literal: true

class CreateSubscriptionPurchaseEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :subscription_purchase_events do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.string :stripe_subscription_id, null: false
      t.string :subscription_status
      t.string :subscription_interval
      t.integer :seat_quantity
      t.string :plan_label
      t.boolean :notification_required, null: false, default: false
      t.datetime :enqueued_at
      t.datetime :tracked_at
      t.datetime :notified_at
      t.timestamps

      t.index [:company_id, :stripe_subscription_id], unique: true, name: "index_subscription_purchase_events_on_purchase"
      t.index :id, where: "tracked_at IS NULL OR (notification_required AND notified_at IS NULL)",
        name: "index_subscription_purchase_events_pending"
    end
  end
end
