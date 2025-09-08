# frozen_string_literal: true
# == Schema Information
#
# Table name: clients
#
#  id           :bigint           not null, primary key
#  address      :string
#  currency     :string           default("USD"), not null
#  discarded_at :datetime
#  email        :string
#  name         :string           not null
#  phone        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#  stripe_id    :string
#
# Indexes
#
#  index_clients_on_company_id            (company_id)
#  index_clients_on_discarded_at          (discarded_at)
#  index_clients_on_email_and_company_id  (email,company_id) UNIQUE
#  index_clients_on_email_trgm            (email) USING gin
#  index_clients_on_name_and_company_id   (name,company_id) UNIQUE
#  index_clients_on_name_trgm             (name) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#

# frozen_string_literal: true

class Client < ApplicationRecord
  include Discard::Model
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
  validates :name, presence: true, length: { maximum: 30 },
    uniqueness: { scope: :company_id, case_sensitive: false, message: "The client %{value} already exists" }
  validates :phone, length: { maximum: 15 }
  # validates :email, presence: true, uniqueness: { scope: :company_id }, format: { with: Devise.email_regexp }

  after_discard :discard_projects

  accepts_nested_attributes_for :addresses, reject_if: :address_attributes_blank?, allow_destroy: true
  scope :with_ids, -> (client_ids) { where(id: client_ids) if client_ids.present? }

  def total_hours_logged(time_frame = "week")
    timesheet_entries.where(
      work_date: DateRangeService.new(timeframe: time_frame).process,
      discarded_at: nil
    ).sum(:duration)
  end

  def project_details(time_frame = "week")
    projects.includes([:project_members]).kept.map do | project |
      {
        id: project.id,
        name: project.name,
        billable: project.billable,
        team: project.project_member_full_names,
        minutes_spent: project.timesheet_entries.where(
          work_date: DateRangeService.new(timeframe: time_frame).process,
          discarded_at: nil
        ).sum(:duration)
      }
    end
  end

  def client_detail(time_frame = "week")
    {
      id:,
      name:,
      email:,
      phone:,
      currency:,
      logo: logo_url,
      minutes_spent: total_hours_logged(time_frame),
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
    status_and_amount = invoices.group_by(&:status).transform_values { |invoices|
      invoices.sum { |invoice|
        invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
      }
    }
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
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
    status_and_amount = invoices.kept.during(duration).group_by(&:status).transform_values { |invoices|
      invoices.sum { |invoice|
        invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
      }
    }
    status_and_amount.default = 0
    {
      paid_amount: status_and_amount["paid"],
      outstanding_amount: status_and_amount["sent"] + status_and_amount["viewed"],
      overdue_amount: status_and_amount["overdue"]
    }
  end

  def outstanding_and_overdue_invoices
    outstanding_overdue_statuses = ["overdue", "sent", "viewed"]
    filtered_invoices = invoices.kept
      .order(issue_date: :desc)
      .includes(:company)
      .select { |invoice| outstanding_overdue_statuses.include?(invoice.status) }

    status_and_amount = invoices.kept.group_by(&:status).transform_values { |invoices|
      invoices.sum { |invoice|
        invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
      }
    }

    status_and_amount.default = 0

    {
      invoices: filtered_invoices,
      total_outstanding_amount: status_and_amount["sent"] + status_and_amount["viewed"],
      total_overdue_amount: status_and_amount["overdue"]
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
end
