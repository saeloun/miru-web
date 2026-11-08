# frozen_string_literal: true

class CreateHiringFeedbacks < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_feedbacks do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_interview_booking, null: false, index: false
      t.references :hiring_panel_member, foreign_key: { on_delete: :nullify }, index: false
      t.bigint :issued_panel_member_id, null: false
      t.text :panel_snapshot, null: false
      t.references :submitted_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.uuid :request_key
      t.text :request_details
      t.text :details
      t.datetime :submitted_at
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :id], unique: true
      t.index [:hiring_interview_booking_id, :issued_panel_member_id], unique: true, name: "index_hiring_feedbacks_on_issued_request"
      t.index [:hiring_panel_member_id, :submitted_at, :id], name: "index_hiring_feedbacks_for_reviewer"
      t.foreign_key :hiring_interview_bookings, column: [:company_id, :hiring_interview_booking_id], primary_key: [:company_id, :id], on_delete: :cascade
      t.check_constraint "(submitted_at IS NULL AND submitted_by_id IS NULL AND request_key IS NULL AND request_details IS NULL AND details IS NULL) OR " \
        "(submitted_at IS NOT NULL AND request_key IS NOT NULL AND request_details IS NOT NULL AND details IS NOT NULL)", name: "hiring_feedback_submission"
    end
  end
end
