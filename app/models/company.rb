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
  has_one :stripe_connected_account, dependent: :destroy
  resourcify

  # Validations
  validates :name, :business_phone, :standard_price, :country, :base_currency, presence: true
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }

  def project_list_after_filter(client_filter = nil, user_filter = nil, search)
    query = project_list(client_filter, user_filter).ransack({ name_or_client_name_cont: search })
    project_list = query.result
    project_ids = project_list.map { |project| project.id }.uniq
    project_ids.map do |id|
      member_list = [], team_member_array = [], billable_array = [], duration_array = [], project_name_array = [],
                    client_name_array = []
      project_list.each do |project|
        if id == project.id
          team_member_array.push("#{project.first_name} #{project.last_name}")
          billable_array.push(project.is_billable)
          client_name_array.push(project.client_name)
          project_name_array.push(project.project_name)
          duration_array.push(project.duration)
        end
      end
      {
        id:,
        name: project_name_array[0],
        client_name: client_name_array[0],
        is_billable: billable_array[0],
        minutes_spent: duration_array.compact.sum,
        team_member: team_member_array.compact.uniq
      }
    end
  end

  def project_list(client_filter, user_filter)
    if client_filter.nil? && user_filter.nil?
      return projects.kept.left_outer_joins(:project_members)
          .joins("LEFT OUTER JOIN users ON users.id = project_members.user_id")
          .joins(:client)
          .joins("LEFT OUTER JOIN timesheet_entries ON timesheet_entries.user_id = project_members.user_id
                      AND timesheet_entries.project_id = projects.id ")
          .select("projects.id as id,
                       projects.name as project_name,
                       projects.billable as is_billable,
                       clients.name as client_name,
                       users.first_name as first_name,
                       users.last_name as last_name,
                       timesheet_entries.duration as duration")
    end
    if !client_filter.nil? && user_filter.nil?
      return projects.kept.left_outer_joins(:project_members)
          .joins("LEFT OUTER JOIN users ON users.id = project_members.user_id")
          .joins(:client)
          .joins("LEFT OUTER JOIN timesheet_entries ON timesheet_entries.user_id = project_members.user_id
                      AND timesheet_entries.project_id = projects.id ")
          .where(client_id: client_filter)
          .select("projects.id as id,
                       projects.name as project_name,
                       projects.billable as is_billable,
                       clients.name as client_name,
                       users.first_name as first_name,
                       users.last_name as last_name,
                       timesheet_entries.duration as duration")
    end
    if client_filter.nil? && !user_filter.nil?
      return projects.kept.left_outer_joins(:project_members)
          .joins("LEFT OUTER JOIN users ON users.id = project_members.user_id")
          .joins(:client)
          .joins("LEFT OUTER JOIN timesheet_entries ON timesheet_entries.user_id = project_members.user_id
                      AND timesheet_entries.project_id = projects.id ")
          .where(timesheet_entries: { user_id: user_filter })
          .select("projects.id as id,
                       projects.name as project_name,
                       projects.billable as is_billable,
                       clients.name as client_name,
                       users.first_name as first_name,
                       users.last_name as last_name,
                       timesheet_entries.duration as duration")
    end
    if !client_filter.nil? && !user_filter.nil?
      projects.kept.left_outer_joins(:project_members)
        .joins("LEFT OUTER JOIN users ON users.id = project_members.user_id")
        .joins(:client)
        .joins("LEFT OUTER JOIN timesheet_entries ON timesheet_entries.user_id = project_members.user_id
                      AND timesheet_entries.project_id = projects.id ")
        .where(timesheet_entries: { user_id: user_filter }, client_id: client_filter)
        .select("projects.id as id,
                       projects.name as project_name,
                       projects.billable as is_billable,
                       clients.name as client_name,
                       users.first_name as first_name,
                       users.last_name as last_name,
                       timesheet_entries.duration as duration")
    end
  end

  def client_details(time_frame = "week")
    clients.kept.map { |client| client.client_detail(time_frame) }
  end

  def client_list
    clients.kept.map do |client|
      { id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address }
    end
  end

  def overdue_and_outstanding_and_draft_amount
    currency = base_currency
    status_and_amount = invoices.group(:status).sum(:amount)
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
      draft_amount: status_and_amount["draft"],
      currency:
    }
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
