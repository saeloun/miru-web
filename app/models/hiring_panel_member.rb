# frozen_string_literal: true

class HiringPanelMember < ApplicationRecord
  DETAIL_KEYS = %w[expertise availability booking_url].freeze

  belongs_to :company
  belongs_to :employment
  serialize :details, coder: JSON
  encrypts :details
  self.filter_attributes += [:details]

  validates :employment_id, uniqueness: { scope: :company_id }
  validate :matching_member
  validate :valid_details
  validate :fixed_member, on: :update

  def active? = HiringPolicy.staff_members(company).exists?(id: employment_id)

  private

    def matching_member
      errors.add(:base, "Choose a staff member in this hiring workspace") unless employment&.company_id == company_id
      errors.add(:base, "Choose an active staff member") if new_record? && !active?
    end

    def valid_details
      unless details.is_a?(Hash) && (details.keys - DETAIL_KEYS).empty? && details.values.all? { |value| value.nil? || value.is_a?(String) && value.valid_encoding? && value.length <= 2000 && !value.include?("\0") }
        errors.add(:base, "Use panel details of at most 2,000 characters per field")
        return
      end
      url = details["booking_url"]
      errors.add(:base, "Use a valid HTTPS booking link without credentials") unless url.blank? || safe_booking_url?(url)
    end

    def safe_booking_url?(value)
      return false if value.match?(/[\x00-\x1f\x7f]/)

      uri = URI.parse(value)
      uri.scheme == "https" && uri.host.present? && uri.userinfo.nil?
    rescue URI::InvalidURIError
      false
    end

    def fixed_member
      if will_save_change_to_company_id? || will_save_change_to_employment_id?
        errors.add(:base, "Add a separate panel profile to select another staff member")
      end
    end
end
