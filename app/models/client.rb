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
    from, to = week_month_year(time_frame)
    (projects.kept.map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
  end

  def hours_logged(time_frame)
    from, to = week_month_year(time_frame)
    projects.kept.map { | project | { name: project.name, team: project.project_team, hour_spend: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
  end

  # def week_month_year (time_frame)
  #   case time_frame
  #   when "year"
  #     return Date.today.beginning_of_year, Date.today.end_of_year
  #   when "month"
  #     return Date.today.beginning_of_month, Date.today.end_of_month
  #   else
  #     return Date.today.beginning_of_week, Date.today.end_of_week
  #   end
  # end
  #

  def week_month_year(time_frame)
    return Date.today.send("beginning_of_#{time_frame}"), Date.today.send(("end_of_#{time_frame}"))
  end

  private
    def discard_projects
      projects.discard_all
    end
end
