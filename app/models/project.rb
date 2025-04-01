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
#  index_projects_on_billable            (billable)
#  index_projects_on_client_id           (client_id)
#  index_projects_on_discarded_at        (discarded_at)
#  index_projects_on_name_and_client_id  (name,client_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :client
  has_many :timesheet_entries, inverse_of: :project
  has_many :project_members, dependent: :destroy

  # Validations
  validates :name, presence: true,
    length: { maximum: 30, message: "Name is too long(Maximum 30 characters are allowed)" },
    uniqueness: { scope: :client_id, case_sensitive: false, message: "The project %{value} already exists" }
  validates :billable, inclusion: { in: [ true, false ] }

  # Callbacks
  after_discard :discard_project_members
  delegate :name, to: :client, prefix: true, allow_nil: true

  scope :with_ids, -> (project_ids) { where(id: project_ids) if project_ids.present? }

  searchkick text_middle: [:name, :client_name]

  # Concerns
  include ProjectSqlQueries

  def search_data
    {
      id: id.to_i,
      name:,
      description:,
      billable:,
      client_id:,
      client_name:,
      discarded_at:
    }
  end

  def project_members_snippet(time_frame)
    date_range = DateRangeService.new(timeframe: time_frame).process
    @_project_members_snippet = project_members_snippet_sql(date_range)
  end

  def total_logged_duration(time_frame)
    @_total_logged_duration = timesheet_entries.kept.joins(
      "RIGHT JOIN project_members ON project_members.user_id = timesheet_entries.user_id"
    ).where(
      project_members: { project_id: id },
      work_date: DateRangeService.new(timeframe: time_frame).process
    ).sum(:duration)
  end

  def project_member_full_names
    project_members.map do |member|
      user = User.find(member.user_id)
      user.full_name
    end
  end

  def overdue_and_outstanding_amounts
    currency = client.company.base_currency
    timesheet_entries_ids = timesheet_entries.kept.ids
    invoices = Invoice
      .joins(:invoice_line_items)
      .where(
        client_id: client.id,
        invoice_line_items: { timesheet_entry_id: timesheet_entries_ids }
      )
      .distinct
      .select(:status, :amount, :base_currency_amount)
    status_and_amount = invoices
      .group_by(&:status)
      .transform_values { |v|
        v.sum { |inv| inv.base_currency_amount.to_f > 0.00 ? inv.base_currency_amount : inv.amount }
      }
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
      currency:
    }
  end

  def minutes_spent
    timesheet_entries.kept.sum(:duration)
  end

  private

    def discard_project_members
      project_members.discard_all
    end

    def calculate_cost(duration, hourly_rate)
      (duration.to_f / 60) * hourly_rate
    end
end
