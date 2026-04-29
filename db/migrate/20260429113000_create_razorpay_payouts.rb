# frozen_string_literal: true

class CreateRazorpayPayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :razorpay_payouts do |t|
      t.references :payment, null: false, foreign_key: true
      t.references :requested_by, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 20, scale: 2, null: false
      t.string :currency, null: false, default: "INR"
      t.integer :status, null: false, default: 0
      t.integer :triggered_by, null: false, default: 0
      t.string :external_id
      t.string :reference_id, null: false
      t.string :idempotency_key, null: false
      t.string :mode, null: false, default: "UPI"
      t.string :recipient_upi_id, null: false
      t.string :recipient_name
      t.string :recipient_email
      t.string :recipient_phone
      t.text :failure_reason
      t.jsonb :raw_response, null: false, default: {}
      t.datetime :processed_at

      t.timestamps
    end

    add_index :razorpay_payouts, :external_id, unique: true, where: "external_id IS NOT NULL"
    add_index :razorpay_payouts, :idempotency_key, unique: true
    add_index :razorpay_payouts, :reference_id, unique: true
    add_index :razorpay_payouts, [:payment_id, :status]
  end
end
