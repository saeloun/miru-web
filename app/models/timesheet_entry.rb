# frozen_string_literal: true

# == Schema Information
#
# Table name: timesheet_entries
#
#  id          :integer          not null, primary key
#  user_id     :integer          not null
#  project_id  :integer          not null
#  duration    :float            not null
#  note        :text             default("")
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

  has_one :invoice_line_item, dependent: :destroy

  before_validation :ensure_bill_status_is_set
  before_validation :ensure_bill_status_is_not_billed, on: :create
  before_validation :ensure_billed_status_should_not_be_changed, on: :update

  validates :duration, :work_date, :bill_status, presence: true
  validates :duration, numericality: { less_than_or_equal_to: Minutes.in_a_day, greater_than_or_equal_to: 0.0 }

  scope :in_workspace, -> (company) { where(project_id: company&.project_ids) }

  def self.during(from, to)
    where(work_date: from..to).order(work_date: :desc)
  end

  def formatted_entry
    {
      id: id,
      project: project.name,
      project_id: project_id,
      client: project.client.name,
      duration: duration,
      note: note,
      work_date: work_date,
      bill_status: bill_status,
      team_member: user.full_name
    }
  end

  private

    def ensure_bill_status_is_set
      return if bill_status.present? || project.nil?

      if project.billable
        self.bill_status = :unbilled
      else
        self.bill_status = :non_billable
      end
    end

    def ensure_bill_status_is_not_billed
      errors.add(:timesheet_entry, I18n.t(:errors)[:create_billed_entry]) if
      self.bill_status == "billed"
    end

    def ensure_billed_status_should_not_be_changed
      errors.add(:timesheet_entry, I18n.t(:errors)[:bill_status_billed]) if
      self.bill_status_changed? && self.bill_status_was == "billed"
    end
end
