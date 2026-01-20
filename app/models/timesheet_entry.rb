# frozen_string_literal: true

# == Schema Information
#
# Table name: timesheet_entries
#
#  id           :bigint           not null, primary key
#  bill_status  :integer          not null
#  discarded_at :datetime
#  duration     :float            not null
#  locked       :boolean          default(FALSE)
#  note         :text             default("")
#  work_date    :date             not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  project_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_timesheet_entries_on_bill_status   (bill_status)
#  index_timesheet_entries_on_discarded_at  (discarded_at)
#  index_timesheet_entries_on_project_id    (project_id)
#  index_timesheet_entries_on_user_id       (user_id)
#  index_timesheet_entries_on_work_date     (work_date)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#

class TimesheetEntry < ApplicationRecord
  include Discard::Model
  extend Pagy::Searchkick
  enum :bill_status, { non_billable: 0, unbilled: 1, billed: 2 }

  belongs_to :user
  belongs_to :project

  has_one :invoice_line_item, dependent: :destroy
  has_one :client, through: :project
  has_one :company, through: :client

  before_validation :ensure_bill_status_is_set
  before_validation :ensure_bill_status_is_not_billed, on: :create
  before_validation :ensure_billed_status_should_not_be_changed, on: :update

  validates :duration, :work_date, :bill_status, presence: true
  validates :duration, numericality: { less_than_or_equal_to: 6000000, greater_than_or_equal_to: 0.0 }
  validate :validate_billable_project
  validate :prevent_edit_if_locked, on: :update

  scope :in_workspace, -> (company) { where(project_id: company&.project_ids) }
  scope :during, -> (from, to) { where(work_date: from..to).order(work_date: :desc) }

  delegate :name, to: :project, prefix: true, allow_nil: true
  delegate :name, to: :client, prefix: true, allow_nil: true
  delegate :full_name, to: :user, prefix: true, allow_nil: true

  scope :search_import, -> { includes(:project, :client, :user) }

  searchkick filterable: [:user_name, :created_at, :project_name, :client_name, :bill_status ],
    word_middle: [:user_name, :note]

  def search_data
    {
      id: id.to_i,
      project_id:,
      client_id: self.project&.client_id,
      user_id:,
      work_date: work_date.to_time,
      note:,
      user_name: user.full_name,
      project_name: project.name,
      client_name: project.client.name,
      bill_status:,
      duration: duration.to_i,
      created_at: created_at.to_time,
      discarded_at:
    }
  end

  def snippet
    {
      id:,
      project: project.name,
      project_id:,
      client: project.client.name,
      duration:,
      note:,
      work_date:,
      bill_status:,
      team_member: user.full_name,
      type: "timesheet"
    }
  end

  def formatted_duration
    total_minutes = duration.to_i
    hours = total_minutes / 60
    minutes = total_minutes % 60
    format("%02d:%02d", hours, minutes)
  end

  def formatted_work_date
    CompanyDateFormattingService.new(work_date, company:).process
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
      errors.add(:timesheet_entry, I18n.t(:errors)[:create_billed_entry]) if billed?
    end

    def ensure_billed_status_should_not_be_changed
      return if Current.user.nil?

      errors.add(:timesheet_entry, I18n.t(:errors)[:bill_status_billed]) if
      self.bill_status_changed? && self.bill_status_was == "billed" && Current.user.primary_role(Current.company) == "employee"
    end

    def validate_billable_project
      if !project&.billable && bill_status == "unbilled"
        errors.add(:base, I18n.t("errors.validate_billable_project"))
      end
    end

    def prevent_edit_if_locked
      return if Current.user.nil?

      if locked && Current.user.primary_role(Current.company) == "employee"
        errors.add(:base, "Cannot edit a locked timesheet entry. Please contact admin.")
      end
    end
end
