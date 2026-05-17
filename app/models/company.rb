# frozen_string_literal: true

class Company < ApplicationRecord
  include MetricsTracking
  include PhoneNumberValidatable

  # Associations
  has_many :employments, dependent: :destroy
  has_many :users, -> { kept }, through: :employments
  has_many :clients, dependent: :destroy
  has_many :projects, through: :clients, dependent: :destroy
  has_many :current_workspace_users, foreign_key: "current_workspace_id", class_name: "User", dependent: :nullify
  has_one_attached :logo
  has_many :timesheet_entries, through: :clients
  has_many :invoices
  has_many :tax_configurations, dependent: :destroy
  has_many :payments, through: :invoices
  has_many :razorpay_payouts, through: :payments
  has_many :agents, dependent: :destroy
  has_one :stripe_connected_account, dependent: :destroy
  has_many :payments_providers, dependent: :destroy
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_many :expenses, dependent: :destroy
  has_many :analytics_reports, dependent: :destroy
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
  validate :business_phone_must_be_valid
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }

  # scopes
  scope :with_kept_employments, -> { merge(Employment.kept) }

  def client_list
    clients.kept.includes(:invoices, :addresses, client_members: :user).map do |client|
      {
        id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.current_address,
        previousInvoiceNumber: client.invoices&.last&.invoice_number || 0,
        client_members: client.client_members_emails
      }
    end
  end

  def overdue_and_outstanding_and_draft_amount
    currency = base_currency
    amounts = InvoiceAmountsSummary.process(invoices.kept)
    {
      overdue_amount: amounts[:overdue_amount],
      outstanding_amount: amounts[:outstanding_amount],
      draft_amount: amounts[:draft_amount],
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

  def address_attributes_blank?(attributes)
    attributes.except("id, address_line_2").values.all?(&:blank?)
  end

  def current_address
    addresses.first
  end

  def team_member_limit
    return Float::INFINITY if billing_exempt?

    pro_access? ? 100 : 3
  end

  def pending_team_seat_invites
    invitations.valid_invitations.where.not(role: :client).count
  end

  def used_team_seats
    users.with_kept_employments.distinct.count
  end

  def reserved_team_seats
    used_team_seats + pending_team_seat_invites
  end

  def billable_team_seats
    [used_team_seats, 1].max
  end

  def client_portal_users_count
    User.from(users_with_only_client_role_for_company.select("users.id"), :client_portal_users).count
  end

  def team_member_limit_reached?
    return false if team_member_limit.infinite?

    reserved_team_seats >= team_member_limit
  end

  def can_add_team_member_role?(role)
    return true if role.to_s == "client"

    !team_member_limit_reached?
  end

  def trial_active?
    trial_started_at.present? && trial_ends_at.present? && trial_ends_at.future?
  end

  def trial_expired?
    trial_started_at.present? && trial_ends_at.present? && trial_ends_at.past?
  end

  def trial_available?
    !billing_exempt? && plan_tier != "paid" && trial_started_at.blank?
  end

  def pro_access?
    billing_exempt? || plan_tier == "paid" || trial_active?
  end

  def stripe_subscription_active?
    %w[active trialing past_due].include?(subscription_status.to_s)
  end

  def current_plan_label
    return "free_pro" if billing_exempt?
    return "pro_trial" if trial_active?
    return "paid" if plan_tier == "paid"

    "free"
  end

  def current_subscription_status
    return "trialing" if trial_active?
    return "trial_expired" if trial_expired? && plan_tier != "paid"

    subscription_status
  end

  def start_pro_trial!(starts_at: Time.current)
    raise ArgumentError, "trial_unavailable" unless trial_available?

    update!(
      trial_started_at: starts_at,
      trial_ends_at: starts_at + 30.days
    )
  end

  def apply_stripe_subscription!(
    stripe_customer_id:,
    stripe_subscription_id: nil,
    subscription_status:,
    subscription_ends_at: nil,
    subscription_interval: nil,
    cancel_at_period_end: false
  )
    attrs = {
      stripe_customer_id:,
      subscription_status:,
      subscription_ends_at:,
      plan_tier: stripe_subscription_access?(subscription_status) ? "paid" : "free",
      cancel_at_period_end:
    }

    attrs[:stripe_subscription_id] = stripe_subscription_id if has_attribute?(:stripe_subscription_id)
    attrs[:subscription_interval] = subscription_interval if has_attribute?(:subscription_interval)

    update!(attrs)
  end

  def revoke_stripe_subscription_access!
    attrs = {
      plan_tier: "free",
      subscription_status: "canceled",
      subscription_ends_at: nil,
      cancel_at_period_end: false
    }

    attrs[:stripe_subscription_id] = nil if has_attribute?(:stripe_subscription_id)
    attrs[:subscription_interval] = nil if has_attribute?(:subscription_interval)

    update!(attrs)
  end

  delegate :formatted_address, to: :current_address

  def billable_clients
    clients
      .joins(:projects)
      .where(projects: { billable: true })
      .kept
      .select("clients.*")
      .distinct
      .order(name: :asc)
  end

  def employees_without_client_role
    users.with_kept_employments
      .where.not(id: users_with_only_client_role_for_company.select("users.id"))
      .distinct
  end

  private

    def business_phone_must_be_valid
      validate_phone_number(:business_phone)
    end

    def users_with_only_client_role_for_company
      users.with_kept_employments
        .joins(:roles)
        .where(roles: { resource_id: id, resource_type: "Company" })
        .group("users.id")
        .having("COUNT(roles.id) = 1 AND MAX(roles.name) = ?", "client")
    end

    def stripe_subscription_access?(status)
      %w[active trialing past_due].include?(status.to_s)
    end
end
