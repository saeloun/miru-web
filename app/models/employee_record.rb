# frozen_string_literal: true

class EmployeeRecord < ApplicationRecord
  SALARY_KEYS = %w[salary_amount salary_currency salary_frequency salary_effective_on].freeze
  BANK_KEYS = %w[bank_account_name bank_name bank_branch bank_country bank_account_currency bank_account_number bank_ifsc bank_swift].freeze
  TEXT_KEYS = (%w[emergency_contact_name emergency_contact_phone] + BANK_KEYS).freeze
  DETAIL_KEYS = (TEXT_KEYS + SALARY_KEYS + ["family_members"]).freeze
  FAMILY_KEYS = %w[name date_of_birth gender relationship].freeze
  AMOUNT_FORMAT = /\A\d{1,10}(?:\.\d{1,2})?\z/

  belongs_to :employment
  has_one :company, through: :employment
  serialize :private_details, coder: JSON, type: Hash
  encrypts :private_details
  audited associated_with: :company, only: [:employment_id]
  after_save :record_salary_version, if: :saved_change_to_private_details?
  before_save :advance_payroll_version, if: :will_save_change_to_private_details?
  after_save :record_bank_change_notice, if: :saved_change_to_private_details?

  validates :employment_id, uniqueness: true
  validate :valid_private_details

  def self.supported_currency?(value)
    value.is_a?(String) && value.match?(/\A[A-Z]{3}\z/) && Money::Currency.find(value).present?
  end

  # Accepts canonical uppercase country codes without coercing stored bank declarations.
  def self.supported_country?(value)
    value.is_a?(String) && value.match?(/\A[A-Z]{2}\z/) && ISO3166::Country[value].present?
  end

  def self.iso_date?(value)
    value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/) && Date.iso8601(value)
  rescue Date::Error
    false
  end

  def details_with_defaults
    DETAIL_KEYS.index_with(nil).merge("family_members" => []).merge(private_details)
  end

  private

    # Equivalent empty bank values must not invalidate the payroll source version.
    def advance_payroll_version
      previous = private_details_in_database || {}
      keys = BANK_KEYS + SALARY_KEYS
      self.payroll_version += 1 unless previous.values_at(*keys).map(&:presence) == private_details.values_at(*keys).map(&:presence)
    end

    def record_bank_change_notice
      previous = private_details_before_last_save || {}
      return if BANK_KEYS.map { |key| previous[key].presence } == BANK_KEYS.map { |key| private_details[key].presence }

      PayrollBankChangeNotice.capture!(employment)
    end

    def record_salary_version
      previous = private_details_before_last_save || {}
      return if previous.slice(*SALARY_KEYS) == private_details.slice(*SALARY_KEYS)

      # Preserve the previous effective salary before the mutable private record replaces it.
      [previous, private_details].each_with_index do |details, index|
        salary = details.slice(*SALARY_KEYS)
        next if salary.empty?

        explicit_date = self.class.iso_date?(salary["salary_effective_on"])
        next if index.zero? && !explicit_date

        effective_on = explicit_date || Date.current
        next if index.zero? && employment.compensation_versions.exists?(effective_on:)

        latest = employment.compensation_versions.order(:effective_on, :id).last
        next if latest&.salary_details == salary

        employment.compensation_versions.create!(effective_on:, salary_details: salary)
      end
    end

    # Allows partial private profiles without treating absent optional bank facts as payment readiness.
    def valid_private_details
      details = private_details
      errors.add(:private_details, "has unsupported fields") if (details.keys - DETAIL_KEYS).any?
      TEXT_KEYS.each { |key| validate_text(details[key], key, key == "emergency_contact_phone" ? 50 : 200) }
      validate_bank(details)
      validate_salary(details)
      validate_family(details["family_members"]) if details.key?("family_members")
    end

    # Checks declared codes independently; bank country does not determine account currency or payment rail.
    def validate_bank(details)
      validate_format(details["bank_account_number"], "bank_account_number", /\A\d{1,34}\z/)
      validate_format(details["bank_ifsc"], "bank_ifsc", /\A[A-Z]{4}0[A-Z0-9]{6}\z/)
      validate_format(details["bank_swift"], "bank_swift", /\A[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\z/)
      country = details["bank_country"]
      if optional_value?(country) && !self.class.supported_country?(country)
        errors.add(:private_details, "bank_country must be a valid uppercase country code")
      end
      currency = details["bank_account_currency"]
      if optional_value?(currency) && !self.class.supported_currency?(currency)
        errors.add(:private_details, "bank_account_currency is unsupported")
      end
    end

    def validate_salary(details)
      amount = details["salary_amount"]
      if optional_value?(amount) && !(amount.is_a?(String) && amount.match?(AMOUNT_FORMAT) && BigDecimal(amount).positive?)
        errors.add(:private_details, "salary_amount must be positive with up to two decimal places")
      end
      currency = details["salary_currency"]
      if optional_value?(currency) && !self.class.supported_currency?(currency)
        errors.add(:private_details, "salary_currency is unsupported")
      end
      frequency = details["salary_frequency"]
      if optional_value?(frequency) && !%w[monthly annual].include?(frequency)
        errors.add(:private_details, "salary_frequency must be monthly or annual")
      end
      validate_date(details["salary_effective_on"], "salary_effective_on")
    end

    def optional_value?(value)
      !value.nil? && value != ""
    end

    def validate_text(value, key, maximum)
      return if value.nil? || (value.is_a?(String) && value.length <= maximum)

      errors.add(:private_details, "#{key} must be text of at most #{maximum} characters")
    end

    def validate_format(value, key, format)
      return unless optional_value?(value)
      return if value.is_a?(String) && value.match?(format)

      errors.add(:private_details, "#{key} has an invalid format")
    end

    def validate_date(value, key, birthday: false)
      return unless optional_value?(value)
      date = self.class.iso_date?(value)
      return if date && (!birthday || date <= Date.current)

      errors.add(:private_details, "#{key} must be a valid ISO date#{birthday ? ' not in the future' : ''}")
    end

    def validate_family(members)
      unless members.is_a?(Array) && members.length <= 20
        errors.add(:private_details, "family_members must be an array of at most 20 members")
        return
      end
      members.each do |member|
        unless member.is_a?(Hash) && (member.keys - FAMILY_KEYS).empty?
          errors.add(:private_details, "family member has an invalid structure")
          next
        end
        errors.add(:private_details, "family member name is required") unless member["name"].is_a?(String) && member["name"].present?
        validate_text(member["name"], "family member name", 200)
        %w[gender relationship].each { |key| validate_text(member[key], "family member #{key}", 50) }
        validate_date(member["date_of_birth"], "family member date_of_birth", birthday: true)
      end
    end
end
