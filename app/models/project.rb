# == Schema Information
#
# Table name: projects
#
#  id           :integer          not null, primary key
#  client_id    :integer          not null
#  name         :string           not null
#  description  :text
#  billable     :boolean          not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  discarded_at :datetime
#
# Indexes
#
#  index_projects_on_client_id     (client_id)
#  index_projects_on_discarded_at  (discarded_at)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  include Discard::Model

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
    project_members.map { |project_member| { user_id: project_member.user_id, user_name: project_member.full_name, user_hourly_rate: project_member.hourly_rate, minutes_logged: (project_member.timesheet_entries.where(project_id: project_member.project_id, work_date: from..to)).sum(:duration) } }
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

  private
    def discard_project_members
      project_members.discard_all
    end
end
