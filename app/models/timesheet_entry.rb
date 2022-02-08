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

  before_validation :insure_bill_status_is_set

  validates :duration, :note, :work_date, :bill_status, presence: true
  validates :duration, numericality: { less_than_or_equal_to: Minutes.in_a_day, greater_than_or_equal_to: 0.0 }

  def self.during(from, to)
    where(work_date: from..to).order(work_date: :desc)
  end

  def formatted_entry
    {
      id: id,
      project: project.name,
      client: project.client.name,
      duration: duration,
      note: note,
      work_date: work_date,
      bill_status: bill_status
    }
  end

  private
    def insure_bill_status_is_set
      if project.billable?
        self.bill_status = :unbilled
      else
        self.bill_status = :non_billable
      end
    end
end
