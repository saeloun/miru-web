# frozen_string_literal: true
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
#  client_code  :string           not null
#
# Indexes
#
#  index_clients_on_company_id            (company_id)
#  index_clients_on_discarded_at          (discarded_at)
#  index_clients_on_email_and_company_id  (email,company_id) UNIQUE
#

# frozen_string_literal: true

class Client < ApplicationRecord
  include Discard::Model

  has_many :projects
  has_many :timesheet_entries, through: :projects
  belongs_to :company

  validates :name, :email, presence: true
  validates :client_code,  presence: true
  validates :email, uniqueness: { scope: :company_id }, format: { with: Devise.email_regexp }

  after_discard :discard_projects

  def total_hours_logged(time_frame = "week")
    from, to = week_month_year(time_frame)
    (projects.kept.map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
  end

  def project_details(time_frame = "week")
    from, to = week_month_year(time_frame)
    projects.kept.map { | project | { name: project.name, team: project.project_member_full_names, minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
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

  private
    def discard_projects
      projects.discard_all
    end
end
