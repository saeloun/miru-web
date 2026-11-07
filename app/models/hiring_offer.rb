# frozen_string_literal: true

class HiringOffer < ApplicationRecord
  class Unavailable < StandardError; end
  DETAIL_KEYS = %w[engagement title amount currency period joining_on expires_on time_zone].freeze
  STATES = %w[preparing sent accepted declined expired].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :issued_by, class_name: "User", optional: true
  %i[request_details edit_details issue_details response_details details].each do |field|
    serialize field, coder: JSON, type: Hash
    encrypts field
  end
  encrypts :access_token, deterministic: true
  has_secure_token :access_token, length: 32, on: :create
  self.filter_attributes += [:request_details, :edit_details, :issue_details, :response_details, :details, :access_token]
  audited associated_with: :company, only: [:state, :issued_by_id, :issued_at, :responded_at, :revoked_at]

  validates :state, inclusion: { in: STATES }
  validates :request_key, format: { with: /\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i }
  validates :request_details, presence: true
  validate :valid_details
  validate :matching_application
  validate :valid_lifecycle
  validate :fixed_history, on: :update

  def review_details
    value = slice(:id, :lock_version, :created_at, :issued_at, :expires_at, :responded_at, :revoked_at).merge(state: current_state, details:, can_email: can_email?)
    value[:private_path] = "/hiring-offer##{access_token}" if issued_at && !revoked_at
    value
  end

  def current_state = state == "sent" && expires_at <= Time.current ? "expired" : state

  def can_email? = state == "sent" && available?

  def expire!
    with_lock { update!(state: "expired") if state == "sent" && expires_at <= Time.current }
  end

  def available?
    application = hiring_application.reload
    decision = application.hiring_decisions.order(id: :desc).first
    !revoked_at && expires_at && expires_at > Time.current && %w[sent accepted declined].include?(state) &&
      (application.stage == "offer" || state == "accepted" && application.stage == "hired") &&
      decision&.id == issue_details["decision_id"] && decision.state == "finalized" && decision.details["outcome"] == "pass" &&
      application.hiring_candidate.reload.email == issue_details["recipient"]
  end

  def candidate_details
    { state: current_state, lock_version:, company_name: issue_details.fetch("company_name"),
      candidate_name: issue_details.fetch("candidate_name"), recipient: issue_details.fetch("recipient"),
      terms: details, issued_at:, expires_at:, responded_at: }
  end

  def reply!(attributes)
    raise Unavailable unless available?
    if response_details.present?
      raise Hiring::Intake::Conflict, "This offer already has a different recorded response." unless response_details == attributes

      return
    end
    unless attributes["offer_version"] == lock_version
      raise Hiring::Intake::Conflict, "The offer changed. Reload its terms before responding."
    end
    update!(state: attributes.fetch("outcome"), responded_at: Time.current, response_details: attributes)
  end

  private

    def matching_application
      errors.add(:base, "Choose an application in this workspace") unless hiring_application&.company_id == company_id
    end

    def valid_lifecycle
      valid = if state == "preparing"
        issued_at.nil? && issued_by_id.nil? && issue_details.empty? && expires_at.nil? && responded_at.nil? && response_details.empty? && revoked_at.nil?
      else
        issued_at && issue_details.present? && expires_at &&
          (%w[accepted declined].include?(state) ? responded_at && response_details.present? : responded_at.nil? && response_details.empty?)
      end
      errors.add(:base, "Issue an offer before recording its response or expiry") unless valid
    end

    def valid_details
      currency = details["currency"]
      amount = details["amount"]
      valid = details.keys.sort == DETAIL_KEYS.sort && %w[employee consultant].include?(details["engagement"]) &&
        details["title"].is_a?(String) && details["title"].present? && details["title"].length <= 200 &&
        !details["title"].match?(/[\x00-\x1F\x7F]/) && amount.is_a?(String) && amount.match?(EmployeeRecord::AMOUNT_FORMAT) &&
        BigDecimal(amount).positive? && EmployeeRecord.supported_currency?(currency) &&
        (BigDecimal(amount) * Money::Currency.find(currency).subunit_to_unit).frac.zero? &&
        %w[monthly annual].include?(details["period"]) && %w[joining_on expires_on].all? { |key| valid_date?(details[key]) } && valid_zone?
      errors.add(:base, "Use complete engagement, title, compensation, joining and expiry terms") unless valid
    end

    def valid_date?(value)
      date = EmployeeRecord.iso_date?(value)
      date && (1900..2099).cover?(date.year) && date.iso8601 == value
    end

    def valid_zone?
      zone = details["time_zone"]
      zone.is_a?(String) && zone.length <= 100 && TZInfo::Timezone.get(zone).present?
    rescue TZInfo::InvalidTimezoneIdentifier
      false
    end

    def fixed_history
      fixed = %w[company_id hiring_application_id created_by_id request_key request_details access_token created_at]
      fixed += %w[details edit_details issue_details issued_at issued_by_id expires_at] unless state_in_database == "preparing"
      fixed += %w[state response_details responded_at] if %w[accepted declined expired].include?(state_in_database)
      errors.add(:base, "Issued offer terms and recorded responses cannot be rewritten") if fixed.any? { |key| will_save_change_to_attribute?(key) }
    end
end
