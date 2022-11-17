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

  # Associations
  belongs_to :client
  has_many :timesheet_entries, inverse_of: :project
  has_many :project_members, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :billable, inclusion: { in: [ true, false ] }

  # Callbacks
  after_discard :discard_project_members
  delegate :name, to: :client, prefix: true, allow_nil: true

  searchkick text_middle: [:name, :client_name]

  def search_data
    {
      id: id.to_i,
      name:,
      description:,
      billable:,
      client_id:,
      client_name:
    }
  end

  def project_team_member_details(time_frame)
    entries = timesheet_entries.includes(:user)
      .where(user_id: project_members.pluck(:user_id), work_date: range_from_timeframe(time_frame))
      .select(:user_id, "SUM(duration) as duration")
      .group(:user_id)

    project_members.map do |member|
      entry = entries.find { |entry| entry.user_id == member.user_id }
      cost = calculate_cost(entry&.duration.presence || 0, member.hourly_rate)
      {
        id: member.user_id,
        name: member.full_name,
        hourly_rate: member.hourly_rate,
        minutes_logged: entry&.duration.presence || 0,
        cost:
      }
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

  def overdue_and_outstanding_amounts
    currency = client.company.base_currency
    timesheet_entries_ids = timesheet_entries.ids
    invoices = Invoice
      .joins(:invoice_line_items)
      .where(
        client_id: client.id,
        invoice_line_items: { timesheet_entry_id: timesheet_entries_ids }
      )
      .distinct
      .select(:status, :amount)
    status_and_amount = invoices
      .group_by(&:status)
      .transform_values { |v| v.sum(&:amount) }
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
      currency:
    }
  end

  def format_amount(amount)
    FormatAmountService.new(client.company.base_currency, amount).process
  end

  private

    def discard_project_members
      project_members.discard_all
    end

    def calculate_cost(duration, hourly_rate)
      (duration.to_f / 60) * hourly_rate
    end
end
