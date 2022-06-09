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
  include UtilityFunctions

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
    members = project_members.pluck(:user_id, :hourly_rate).to_h
    entries = timesheet_entries.includes(:user)
      .where(user_id: members.keys, work_date: range_from_timeframe(time_frame))
      .select(:user_id, "SUM(duration) as duration")
      .group(:user_id)

    if entries.empty?
      project_members.map do |member|
        {
          id: member.user_id,
          name: member.full_name,
          hourly_rate: member.hourly_rate,
          minutes_logged: 0
        }
      end
    else
      entries.map do |entry|
        {
          id: entry.user_id,
          name: entry.user.full_name,
          hourly_rate: members[entry.user_id],
          minutes_logged: entry.duration
        }
      end
    end
  end

  def project_member_full_names
    project_members.map do |member|
      user = User.find(member.user_id)
      user.full_name
    end
  end

  def total_hours_logged(time_frame = "week")
    timesheet_entries.where(work_date: range_from_timeframe(time_frame)).sum(:duration)
  end

  private

    def discard_project_members
      project_members.discard_all
    end
end
