# frozen_string_literal: true
# == Schema Information
#
# Table name: clients
#
#  id           :bigint           not null, primary key
#  address      :string
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
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#

# frozen_string_literal: true

class Client < ApplicationRecord
  include Discard::Model

  has_many :projects
  has_many :timesheet_entries, through: :projects
  has_many :invoices, dependent: :destroy
  belongs_to :company

  validates :name, :email, presence: true
  validates :email, uniqueness: { scope: :company_id }, format: { with: Devise.email_regexp }
  after_discard :discard_projects
  after_commit :reindex_projects

  def reindex_projects
    projects.reindex
  end

  def total_hours_logged(time_frame = "week")
    timesheet_entries.where(work_date: DateRangeService.new(timeframe: time_frame).process)
      .sum(:duration)
  end

  def project_details(time_frame = "week")
    projects.kept.map do | project |
      {
        id: project.id,
        name: project.name,
        billable: project.billable,
        team: project.project_member_full_names,
        minutes_spent: project.timesheet_entries.where(work_date: DateRangeService.new(timeframe: time_frame).process)
          .sum(:duration)
      }
    end
  end

  def client_detail(time_frame = "week")
    {
      id:,
      name:,
      email:,
      phone:,
      address:,
      minutes_spent: total_hours_logged(time_frame)
    }
  end

  def client_overdue_and_outstanding_calculation
    currency = company.base_currency
    status_and_amount = invoices.group(:status).sum(:amount)
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
      currency:
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
    status_and_amount = invoices.during(duration).group(:status).sum(:amount)
    status_and_amount.default = 0
    {
      name:,
      paid_amount: status_and_amount["paid"],
      unpaid_amount: status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    }
  end

  def outstanding_and_overdue_invoices
    outstanding_overdue_statuses = ["overdue", "sent", "viewed"]
    filtered_invoices = invoices.select { |invoice| outstanding_overdue_statuses.include?(invoice.status) }
    status_and_amount = invoices.group(:status).sum(:amount)
    status_and_amount.default = 0

    {
      name:,
      invoices: filtered_invoices,
      total_outstanding_amount: status_and_amount["sent"] + status_and_amount["viewed"],
      total_overdue_amount: status_and_amount["overdue"]
    }
  end

  private

    def stripe_connected_account
      StripeConnectedAccount.find_by!(company:)
    end

    def discard_projects
      projects.discard_all
    end
end
