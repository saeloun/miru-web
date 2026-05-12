# frozen_string_literal: true

class Client < ApplicationRecord
  include Discardable
  include Searchable
  include MetricsTracking

  # Configure pg_search
  pg_search_scope :pg_search,
    against: [:name, :email, :phone, :address],
    using: {
      tsearch: { prefix: true },
      trigram: { threshold: 0.3 }
    }

  has_many :projects
  has_many :timesheet_entries, through: :projects
  has_many :invoices, dependent: :destroy
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :client_members, dependent: :destroy
  has_many :invitations
  has_one_attached :logo
  belongs_to :company

  before_save :strip_attributes
  before_validation :normalize_optional_email
  validates :name, presence: true, length: { maximum: 30 },
    uniqueness: { scope: :company_id, case_sensitive: false, message: "The client %{value} already exists" }
  validates :phone, phone: { possible: true, allow_blank: true }, length: { maximum: 16 }
  validates :email, format: { with: Devise.email_regexp }, allow_blank: true
  validates :email, uniqueness: { scope: :company_id, case_sensitive: false }, allow_blank: true

  after_discard :discard_projects

  accepts_nested_attributes_for :addresses, reject_if: :address_attributes_blank?, allow_destroy: true
  scope :with_ids, -> (client_ids) { where(id: client_ids) if client_ids.present? }

  def total_hours_logged(time_frame = "week")
    timesheet_entries.where(
      work_date: DateRangeService.new(timeframe: time_frame).process,
      discarded_at: nil
    ).sum(:duration)
  end

  def project_details(time_frame = "week", duration_by_project_id: nil)
    kept_projects = projects.kept.includes(project_members: :user)
    duration_by_project_id ||= TimesheetEntry.kept.where(
      project_id: kept_projects.map(&:id),
      work_date: DateRangeService.new(timeframe: time_frame).process
    ).group(:project_id).sum(:duration)

    kept_projects.map do | project |
      {
        id: project.id,
        name: project.name,
        billable: project.billable,
        team: project.project_member_full_names,
        minutes_spent: duration_by_project_id.fetch(project.id, 0)
      }
    end
  end

  def client_detail(time_frame = "week", minutes_spent: nil)
    {
      id:,
      name:,
      email:,
      phone:,
      currency:,
      previousInvoiceNumber: invoices.kept.order(created_at: :desc).pick(:invoice_number) || 0,
      logo: logo_url,
      minutes_spent: minutes_spent || total_hours_logged(time_frame),
      address: current_address
    }
  end

  def logo_url
    logo.attached? ? Rails.application.routes.url_helpers.polymorphic_url(
      logo, only_path: true
    ) : ""
  end

  def client_overdue_and_outstanding_calculation
    currency = company.base_currency
    client_currency = self.currency
    amounts = InvoiceAmountsSummary.process(invoices.kept)
    {
      overdue_amount: amounts[:overdue_amount],
      outstanding_amount: amounts[:outstanding_amount],
      currency:,
      client_currency:
    }
  end

  def register_on_stripe!
    self.transaction do
      customer = Stripe::Customer.create(
        {
          email:,
          name:,
          phone:,
          metadata: {
            platform_id: id
          }
        }, {
          stripe_account: stripe_connected_account.account_id
        })

      update!(stripe_id: customer.id)
    end
  end

  def payment_summary(duration)
    amounts = InvoiceAmountsSummary.process(invoices.kept.during(duration))
    {
      paid_amount: invoices.kept.during(duration).paid.sum(Arel.sql(InvoiceAmountsSummary::FULL_AMOUNT_SQL)).to_f.round(2),
      outstanding_amount: amounts[:outstanding_amount],
      overdue_amount: amounts[:overdue_amount]
    }
  end

  def outstanding_and_overdue_invoices
    outstanding_overdue_statuses = ["overdue", "sent", "viewed"]
    filtered_invoices = invoices.kept
      .order(issue_date: :desc)
      .includes(:company)
      .select { |invoice| outstanding_overdue_statuses.include?(invoice.status) }

    amounts = InvoiceAmountsSummary.process(invoices.kept)

    {
      invoices: filtered_invoices,
      total_outstanding_amount: amounts[:outstanding_amount] - amounts[:overdue_amount],
      total_overdue_amount: amounts[:overdue_amount]
    }
  end

  def address_attributes_blank?(attributes)
    attributes.except("id, address_line_2").values.all?(&:blank?)
  end

  def current_address
    addresses.first
  end

  def formatted_address
    current_address&.formatted_address
  end


  def client_members_emails
    client_members.kept.includes(:user).pluck("users.email")
  end

  def client_virtual_verified_emails
    invitations.where(virtual_verified: true, accepted_at: nil).pluck(:recipient_email)
  end

  def send_invoice_emails(virtual_verified)
    if virtual_verified
      client_members_emails + client_virtual_verified_emails
    else
      client_members_emails
    end
  end

  private

    def stripe_connected_account
      StripeConnectedAccount.find_by!(company:)
    end

    def discard_projects
      projects.discard_all
    end

    def strip_attributes
      name.strip!
    end

    # Keep optional email truly optional by avoiding duplicate blank-string collisions
    # against the unique DB index on [email, company_id].
    def normalize_optional_email
      self.email = email.to_s.strip.presence
    end
end
