# frozen_string_literal: true

class CreateHiringInterviewBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_interview_bookings do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_interview, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :number, null: false
      t.uuid :request_key, null: false
      t.text :request_details, null: false
      t.text :details, null: false
      t.text :round_details, null: false
      t.text :panel_snapshot, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.datetime :feedback_due_at, null: false
      t.string :status, null: false, default: "scheduled"
      t.datetime :ended_at
      t.text :ending_reason
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :id], unique: true
      t.index [:hiring_interview_id, :number], unique: true
      t.index [:hiring_interview_id, :request_key], unique: true
      t.index :hiring_interview_id, unique: true, where: "status = 'scheduled'", name: "index_hiring_interview_current_booking"
      t.index [:status, :feedback_due_at]
      t.foreign_key :hiring_interviews, column: [:company_id, :hiring_interview_id], primary_key: [:company_id, :id], on_delete: :cascade
      t.check_constraint "number > 0", name: "hiring_booking_number"
      t.check_constraint "ends_at > starts_at AND feedback_due_at > ends_at", name: "hiring_booking_times"
      t.check_constraint "(status = 'scheduled' AND ended_at IS NULL AND ending_reason IS NULL) OR " \
        "(status IN ('cancelled', 'completed', 'no_show') AND ended_at IS NOT NULL AND ending_reason IS NOT NULL)", name: "hiring_booking_status"
    end
  end
end
