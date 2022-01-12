# frozen_string_literal: true

# == Schema Information
#
# Table name: timesheet_entries
#
#  id          :integer          not null, primary key
#  user_id     :integer          not null
#  project_id  :integer          not null
#  duration    :float            not null
#  note        :text             not null
#  work_date   :date             not null
#  bill_status :integer          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_timesheet_entries_on_project_id  (project_id)
#  index_timesheet_entries_on_user_id     (user_id)
#

class TimesheetEntry < ApplicationRecord
  enum bill_status: [:non_billable, :unbilled, :billed]

  belongs_to :user
  belongs_to :project

  validates :duration, :note, :work_date, :bill_status, presence: true
  validates :duration, numericality: { less_than_or_equal_to: 24.0, greater_than_or_equal_to: 0.0 }
end
