# == Schema Information
#
# Table name: companies
#
#  id               :bigint           not null, primary key
#  address          :text
#  base_currency    :string           default("USD"), not null
#  business_phone   :string
#  calendar_enabled :boolean          default(TRUE)
#  country          :string           not null
#  date_format      :string
#  fiscal_year_end  :string
#  name             :string           not null
#  standard_price   :decimal(, )      default(0.0), not null
#  timezone         :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  # Associations
  has_many :employments, dependent: :destroy
  has_many :users, -> { kept }, through: :employments
  has_many :clients, dependent: :destroy
  has_many :projects, through: :clients, dependent: :destroy
  has_many :current_workspace_users, foreign_key: "current_workspace_id", class_name: "User", dependent: :nullify
  has_one_attached :logo
  has_many :timesheet_entries, through: :clients
  has_many :invoices
  has_many :payments, through: :invoices
  has_one :stripe_connected_account, dependent: :destroy
  has_one :bank_account, dependent: :destroy
  has_many :payments_providers, dependent: :destroy
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_many :expenses, dependent: :destroy
  has_many :expense_categories, dependent: :destroy
  has_many :vendors, dependent: :destroy
  has_many :client_members, dependent: :destroy
  has_many :leaves, class_name: "Leave", dependent: :destroy
  has_many :leave_types, through: :leaves, dependent: :destroy
  has_many :timeoff_entries, through: :users
  has_many :holidays, dependent: :destroy
  has_many :holiday_infos, through: :holidays, dependent: :destroy
  has_many :carryovers
  has_many :notification_preferences, dependent: :destroy

  resourcify

  accepts_nested_attributes_for :addresses, reject_if: :address_attributes_blank?, allow_destroy: true

  # Validations
  validates :name, :standard_price, :country, :base_currency, presence: true
  validates :name, length: { maximum: 30 }
  validates :business_phone, length: { maximum: 15 }
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }

  # scopes
  scope :with_kept_employments, -> { merge(Employment.kept) }

  def client_list
    clients.kept.map do |client|
      {
        id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.current_address,
        previousInvoiceNumber: client.invoices&.last&.invoice_number || 0,
        client_members: client.client_members_emails
      }
    end
  end

  def overdue_and_outstanding_and_draft_amount
    currency = base_currency
    status_and_amount = invoices.kept.group(:status).sum(:amount)
    status_and_amount.default = 0
    outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
    {
      overdue_amount: status_and_amount["overdue"],
      outstanding_amount:,
      draft_amount: status_and_amount["draft"],
      currency:
    }
  end

  def company_logo
    return nil if !logo.attached?

    Rails.application.routes.url_helpers.polymorphic_url(logo, only_path: true)
  end

  def stripe_account_id
    stripe_connected_account&.account_id
  end

  def all_expense_categories
    ExpenseCategory.default_categories.order(:created_at) + expense_categories.order(:created_at)
  end

  def address_attributes_blank?(attributes)
    attributes.except("id, address_line_2").values.all?(&:blank?)
  end

  def current_address
    addresses.first
  end

  def formatted_address
    current_address.formatted_address
  end

  def billable_clients
    clients
      .distinct
      .joins(:projects)
      .where(projects: { billable: true })
      .kept
      .order(name: :asc)
  end

  def employees_without_client_role
    user_ids_with_only_client_role = users.with_kept_employments
      .joins(:roles)
      .group("users.id, roles.resource_id, roles.resource_type")
      .having("COUNT(roles.id) = 1 AND MAX(roles.name) = 'client' \
              AND roles.resource_id = #{id} \
              AND roles.resource_type = 'Company'")
      .pluck("users.id")

    users.with_kept_employments.where.not(id: user_ids_with_only_client_role).distinct
  end
end
