# == Schema Information
#
# Table name: companies
#
#  id              :integer          not null, primary key
#  name            :string           not null
#  address         :text             not null
#  business_phone  :string
#  base_currency   :string           default("USD"), not null
#  standard_price  :decimal(, )      default("0.0"), not null
#  fiscal_year_end :string
#  date_format     :string
#  country         :string           not null
#  timezone        :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  # Associations
  has_many :company_users, dependent: :destroy
  has_many :users, through: :company_users
  has_many :timesheet_entries, through: :users
  has_many :clients, dependent: :destroy
  has_many :projects, through: :clients, dependent: :destroy
  has_many :current_workspace_users, foreign_key: "current_workspace_id", class_name: "User", dependent: :nullify
  has_one_attached :logo
  has_many :timesheet_entries, through: :clients
  has_many :invoices, through: :clients
  resourcify

  # Validations
  validates :name, :business_phone, :standard_price, :country, :base_currency, presence: true
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }

  def client_details(time_frame = "week")
    clients.kept.map { |client| client.client_detail(time_frame) }
  end

  # Method for project list page along with client and user filter START

  # Project Filter START
  def project_list_after_filter(time_frame, client_filter = nil, user_filter = nil)
    project_list = project_list(time_frame)
    project_list_after_client_filter = project_list[:project_details].filter_map do |project|
      client_filter.nil? ? project : (project if client_filter.include?(project[:client_name]))
    end
    project_list_after_user_filter = project_list_after_client_filter.filter_map do |project|
      user_filter.nil? ? project : (project if user_filter.any? { |user|
  project[:project_team_member].include?(user)
})
    end.compact
    { project_details: project_list_after_user_filter, project_users_list: project_list[:project_users_list] }
  end
  # Project Filter END

  # Project last START
  def project_list(time_frame)
    from, to = week_month_year(time_frame)
    project_list = projects.kept.includes(:client, :timesheet_entries, timesheet_entries: [:user])
    project_details = project_list.uniq.map do |project|
      project_team_member = (project.timesheet_entries.map { | timesheet_entries |
  timesheet_entries.user.full_name
}).uniq
      minutes_logged = (project.timesheet_entries.map { | timesheet_entries |
  timesheet_entries.duration if (from..to).include?(timesheet_entries.work_date)
}).compact.sum
      {
        id: project.id, name: project.name, description: project.description,
        billable: project.billable, client_id: project.client.id, client_name: project.client.name,
        project_team_member:, minutes_logged:
      }
    end
    project_users_list = (project_details.map { | project | project[:project_team_member] }).flatten.uniq
    { project_details:, project_users_list: }
  end
  # Project list END

  # Method for project list page along with client and user filter END

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

  def client_list
    clients.kept.map do |client|
      { id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address }
    end
  end

  def user_details
    users.kept.map do |user|
      {
        id: user.id,
        name: user.full_name
      }
    end
  end
end
