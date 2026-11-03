# frozen_string_literal: true

class PayrollMercuryConnection < ApplicationRecord
  ENVIRONMENTS = %w[live sandbox].freeze
  VERSIONED_FIELDS = %w[api_token environment source_account_id expected_legal_business_name].freeze
  UUID = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

  self.filter_attributes += [:api_token]
  encrypts :api_token

  belongs_to :company
  belongs_to :configured_by, class_name: "User"
  belongs_to :verified_by, class_name: "User", optional: true
  audited associated_with: :company, only: [:environment, :source_account_id, :credential_version, :verified_at]

  before_validation :require_payroll_entitlement
  before_save :invalidate_verification, if: -> { persisted? && (changed & VERSIONED_FIELDS).any? }

  validates :company_id, uniqueness: true
  validates :environment, inclusion: { in: ENVIRONMENTS }
  validates :source_account_id, format: { with: UUID }
  validates :expected_legal_business_name, presence: true, length: { maximum: 200 }
  validates :wire_fee_minor, numericality: { only_integer: true, greater_than: 0, less_than: 100_000 }
  validates :api_token, presence: true, length: { maximum: 512 }, format: { with: /\A[[:graph:]]+\z/ }

  def read_verified?
    verified_at.present? && verified_version == credential_version
  end

  def serializable_hash(options = nil)
    super((options || {}).merge(except: [:api_token]))
  end

  def client
    PayrollProviders::MercuryClient.new(environment:, company_id:, token: api_token)
  end

  def balance_adapter
    PayrollProviders::MercuryBalance.new(
      binding: { company_id:, account_id: source_account_id, legal_business_name: expected_legal_business_name },
      token: api_token, environment: environment.to_sym
    )
  end

  def account_reference
    Digest::SHA256.hexdigest("mercury:#{company_id}:#{source_account_id}")
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end

    def invalidate_verification
      self.credential_version += 1
      assign_attributes(verified_at: nil, verified_version: nil, verified_by: nil,
        verified_account_name: nil, verified_account_mask: nil)
    end
end
