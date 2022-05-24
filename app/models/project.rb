# == Schema Information
#
# Table name: projects
#
#  id           :bigint           not null, primary key
#  billable     :boolean          not null
#  description  :text
#  discarded_at :datetime
#  name         :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  client_id    :bigint           not null
#
# Indexes
#
#  index_projects_on_client_id     (client_id)
#  index_projects_on_discarded_at  (discarded_at)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  include Discard::Model
  default_scope -> { kept }

  # Associations
  belongs_to :client
  has_many :timesheet_entries
  has_many :project_members, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :billable, inclusion: { in: [ true, false ] }

  # Callbacks
  after_discard :discard_project_members

  def project_team_member_details(time_frame)
    from, to = week_month_year(time_frame)
    project_members_timesheet_entries = timesheet_entries.where(
      user_id: project_members.pluck(:user_id),
      work_date: from..to)
    project_members.map do |project_member|
      minutes_logged = project_members_timesheet_entries.filter_map do |project_members_timesheet_entry|
        project_members_timesheet_entry.duration if project_members_timesheet_entry.user_id == project_member.user_id
      end.sum
      {
        id: project_member.user_id, name: project_member.full_name, hourly_rate: project_member.hourly_rate,
        minutes_logged:
      }
    end
  end

  def week_month_year(time_frame)
    case time_frame
    when "last_week"
      return ((Date.today.beginning_of_week) - 7), ((Date.today.end_of_week) - 7)
    when "month"
      return Date.today.beginning_of_month, Date.today.end_of_month
    when "year"
      return Date.today.beginning_of_year, Date.today.end_of_year
    else
      return Date.today.beginning_of_week, Date.today.end_of_week
    end
  end

  def project_member_full_names
    project_members.map do |member|
      user = User.find(member.user_id)
      user.full_name
    end
  end

  def total_hours_logged(time_frame = "week")
    from, to = week_month_year(time_frame)
    timesheet_entries.where(work_date: from..to).sum(:duration)
  end

  private

    def discard_project_members
      project_members.discard_all
    end
end
