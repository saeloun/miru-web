# frozen_string_literal: true

class PayrollRun < ApplicationRecord
  belongs_to :company
  belongs_to :accounts_reviewer, class_name: "User"
  belongs_to :final_reviewer, class_name: "User"
  has_many :payroll_revisions, dependent: :restrict_with_exception
  before_validation :require_payroll_entitlement, on: :create

  validates :period, :currency, presence: true
  validates :currency, format: { with: /\A[A-Z]{3}\z/ }
  validates :dry_run, inclusion: { in: [true] }
  validates :period, uniqueness: { scope: [:company_id, :currency] }
  validate :month_start
  validate :known_currency
  validate :reviewers_are_eligible

  def readonly?
    persisted?
  end

  def current_revision
    Payroll::Entitlement.require!(company_id)
    payroll_revisions.order(number: :desc).first
  end

  def eligible_actor?(actor, stage)
    return false unless Payroll::Entitlement.enabled?(company_id)
    return false unless actor&.persisted? && company_id && period
    return false unless User.kept.exists?(id: actor.id)
    return false unless Employment.kept.where(company_id:, user_id: actor.id)
      .where("joined_at <= ? AND (resigned_at IS NULL OR resigned_at >= ?)", Date.current, Date.current).exists?

    names = stage == "final" ? ["owner"] : ["book_keeper", "admin", "owner"]
    actor.roles.where(resource: company, name: names).exists?
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end

    def month_start
      errors.add(:period, "must be the first day of a month") if period && period.day != 1
    end

    def known_currency
      errors.add(:currency, "must be a supported currency") unless Money::Currency.find(currency)
    end

    def reviewers_are_eligible
      errors.add(:accounts_reviewer, "must be an active accounts reviewer") unless eligible_actor?(accounts_reviewer, "accounts")
      errors.add(:final_reviewer, "must be an active owner") unless eligible_actor?(final_reviewer, "final")
      errors.add(:final_reviewer, "must differ from accounts reviewer") if accounts_reviewer_id == final_reviewer_id
    end
end
