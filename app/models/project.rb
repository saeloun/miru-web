# frozen_string_literal: true

class Project < ApplicationRecord
  include Discardable
  include Searchable
  include MetricsTracking

  # Configure pg_search
  pg_search_scope :pg_search,
    against: [:name, :description],
    using: {
      tsearch: { prefix: true },
      trigram: { threshold: 0.3 }
    }

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

  # Concerns
  include ProjectSqlQueries


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
    project_members.includes(:user).filter_map { |member| member.user&.full_name }
  end

  def overdue_and_outstanding_amounts
    currency = client.company.base_currency
    client_currency = client.currency
    timesheet_entries_ids = timesheet_entries.kept.ids
    invoices = Invoice
      .joins(:invoice_line_items)
      .where(
        client_id: client.id,
        invoice_line_items: { timesheet_entry_id: timesheet_entries_ids }
      )
      .distinct
      .select(:status, :amount, :base_currency_amount)
    amounts = InvoiceAmountsSummary.process(invoices)
    {
      overdue_amount: amounts[:overdue_amount],
      outstanding_amount: amounts[:outstanding_amount],
      currency:,
      client_currency:
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
