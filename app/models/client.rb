# == Schema Information
#
# Table name: clients
#
#  id           :integer          not null, primary key
#  company_id   :integer          not null
#  name         :string           not null
#  email        :string
#  phone        :string
#  address      :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  discarded_at :datetime
#
# Indexes
#
#  index_clients_on_company_id    (company_id)
#  index_clients_on_discarded_at  (discarded_at)
#

# frozen_string_literal: true

class Client < ApplicationRecord
  include Discard::Model

  has_many :projects
  has_many :timesheet_entries, through: :projects
  belongs_to :company

  validates :name, :email, presence: true
  validates :email, uniqueness: true, format: { with: Devise.email_regexp }

  after_discard :discard_projects

  def project_total_hours(time_frame)
    if time_frame == "year"
      from = Date.today.beginning_of_year
      to = Date.today.end_of_year
    elsif time_frame == "month"
      from = Date.today.beginning_of_month
      to = Date.today.end_of_month
    else
      from = Date.today.beginning_of_week
      to = Date.today.end_of_week
    end
    hours = 0
    projects.each do |project|
      temp_hours = project.timesheet_entries.where(work_date: from..to).sum(:duration)
      hours += temp_hours
    end
    hours
  end

  def hours_logged(time_frame)
    if time_frame == "year"
      from = Date.today.beginning_of_year
      to = Date.today.end_of_year
    elsif time_frame == "month"
      from = Date.today.beginning_of_month
      to = Date.today.end_of_month
    else
      from = Date.today.beginning_of_week
      to = Date.today.end_of_week
    end
    hour = []
    projects.each do |project|
      project_hash = {}
      project_hash[:name] = project.name
      project_hash[:hour_spend] = project.timesheet_entries.where(work_date: from..to).sum(:duration)
      hour.push(project_hash)
    end
    hour
  end

  private
    def discard_projects
      projects.discard_all
    end
end
