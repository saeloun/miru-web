# frozen_string_literal: true

# == Schema Information
#
# Table name: space_usages
#
#  id             :bigint           not null, primary key
#  end_duration   :float
#  note           :text
#  purpose_code   :integer
#  restricted     :boolean
#  space_code     :integer
#  start_duration :float
#  team_members   :text             default([]), is an Array
#  work_date      :date
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  company_id     :bigint           not null
#  user_id        :bigint           not null
#
# Indexes
#
#  index_space_usages_on_company_id  (company_id)
#  index_space_usages_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class SpaceUsage < ApplicationRecord
  CodeOptionKlass = Struct.new(:name, :id, :alias)

  SPACE_CODE_OPTIONS = [
    CodeOptionKlass.new("Conference Room", 1, "CR"),
    CodeOptionKlass.new("HR Cabin", 2, "HRC"),
    CodeOptionKlass.new("Sales Cabin", 3, "SC"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC1"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC2"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC3"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC4"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC5"),
    # CodeOptionKlass.new("Coming Soon", -1, "SC6"),
  ]

  PURPOSE_CODE_OPTIONS = [
    CodeOptionKlass.new("Client / Standup", 1),
    CodeOptionKlass.new("Client / All Hands", 2),
    CodeOptionKlass.new("Client / Other", 3),
    CodeOptionKlass.new("Internal / Standup", 4),
    CodeOptionKlass.new("Internal / All Hands", 5),
    CodeOptionKlass.new("Internal / Project Discussion", 6),
    CodeOptionKlass.new("Internal / Other", 7),
    CodeOptionKlass.new("Interview", 8),
    CodeOptionKlass.new("Training", 9),
    CodeOptionKlass.new("KS/KT Knowledge Sharing", 10),
    CodeOptionKlass.new("1:1 One on One", 11),
  ]

  before_destroy :check_is_past_date
  belongs_to :user
  belongs_to :company

  validates :start_duration, :end_duration, :work_date, presence: true
  validates :start_duration, numericality: { less_than_or_equal_to: Minutes.in_a_day, greater_than_or_equal_to: 0.0 }
  validates :end_duration, numericality: { less_than_or_equal_to: Minutes.in_a_day, greater_than_or_equal_to: 0.0 }
  validate :valid_end_duration
  validate :is_past_date

  scope :in_workspace, -> (company) { where(company_id: company&.id) }
  scope :during, -> (from, to) { where(work_date: from..to).order(work_date: :desc) }

  delegate :full_name, to: :user, prefix: true, allow_nil: true

  after_commit on: [:create], if: proc { |record| record.previous_changes.present? } do
    SpaceUsageSlackNotifyJob.perform_later("create", self.attributes.as_json)
  end
  after_commit on: [:update], if: proc { |record| record.previous_changes.present? } do
    SpaceUsageSlackNotifyJob.perform_later("update", self.attributes.as_json)
  end

  # searchkick

  def search_data
    {
      id: id.to_i,
      user_id:,
      work_date:,
      start_duration:,
      end_duration:,
      space_code:,
      purpose_code:,
      space_name: SPACE_CODE_OPTIONS.find { |i|i.id == space_code }&.name,
      purpose_name: PURPOSE_CODE_OPTIONS.find { |i|i.id == purpose_code }&.name
    }
  end

  def formatted_entry
    {
      id: id.to_i,
      user_id:,
      work_date:,
      start_duration:,
      end_duration:,
      space_code:,
      purpose_code:,
      space_name: SPACE_CODE_OPTIONS.find { |i|i.id == space_code }&.name,
      purpose_name: PURPOSE_CODE_OPTIONS.find { |i|i.id == purpose_code }&.name,
      note:,
      user_name: user.full_name,
      user_color: user.color,
      department_id: user.department_id,
      team_members:
    }
  end

  def formatted_duration(type = :start)
    minutes = (type == :end ? end_duration : start_duration).to_i
    Time.parse("#{minutes / 60}:#{minutes % 60}").strftime("%H:%M")
  end

  def formatted_duration_12hr(type = :start)
    minutes = (type == :end ? end_duration : start_duration).to_i
    Time.parse("#{minutes / 60}:#{minutes % 60}").strftime("%I:%M %p")
  end

  def valid_end_duration
    return if self.start_duration.to_i < self.end_duration

    errors.add(:end_duration, "should be more then Start time")
  end

  def is_past_date
    if Time.parse(self.work_date.to_s) < Time.parse(Time.now.strftime("%Y-%m-%d"))
      errors.add(:base, "You Can't Travel Back in Time.")
    end
  end

  def check_is_past_date
    if Time.parse(self.work_date.to_s) < Time.parse(Time.now.strftime("%Y-%m-%d"))
      errors.add(:base, "You Can't Travel Back in Time.")
      throw :abort
    end
  end

  # private

  #   def ensure_bill_status_is_set
  #     return if bill_status.present? || project.nil?

  #     if project.billable
  #       self.bill_status = :unbilled
  #     else
  #       self.bill_status = :non_billable
  #     end
  #   end

  #   def ensure_bill_status_is_not_billed
  #     errors.add(:timesheet_entry, I18n.t(:errors)[:create_billed_entry]) if
  #     self.bill_status == "billed"
  #   end

  #   def ensure_billed_status_should_not_be_changed
  #     errors.add(:timesheet_entry, I18n.t(:errors)[:bill_status_billed]) if
  #     self.bill_status_changed? && self.bill_status_was == "billed"
  #   end
end
