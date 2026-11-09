# frozen_string_literal: true

class Payroll::BillingFacts
  FIELDS = %w[legal_name address_line_1 address_line_2 city state postal_code country pan_status pan_number pan_reason gst_status gst_number gst_scheme gst_reason].freeze

  def self.normalize(value)
    unless value.is_a?(Hash) && value.keys.sort == FIELDS.sort && value.values.all? { |entry| entry.is_a?(String) }
      invalid!
    end
    facts = value.transform_values(&:strip)
    %w[pan_number gst_number].each { |key| facts[key] = facts[key].upcase }
    %w[legal_name address_line_1 city state].each { |key| invalid! unless facts[key].length.between?(1, 200) }
    invalid! unless facts["address_line_2"].length <= 200 && facts["postal_code"].match?(/\A\d{6}\z/) && facts["country"] == "IN"
    invalid! unless facts.values.all? { |entry| !entry.match?(/[\x00-\x1f\x7f]/) && entry.length <= 1000 }
    validate_pan!(facts)
    validate_gst!(facts)
    facts
  end

  def self.validate_pan!(facts)
    if facts["pan_status"] == "provided"
      invalid! unless facts["pan_number"].match?(/\A[A-Z]{5}\d{4}[A-Z]\z/)
    elsif facts["pan_status"] == "not_available"
      invalid! unless facts["pan_number"].empty? && facts["pan_reason"].present?
    else
      invalid!
    end
  end

  def self.validate_gst!(facts)
    if facts["gst_status"] == "registered"
      invalid! unless facts["pan_status"] == "provided" && facts["gst_number"].match?(/\A\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]{3}\z/) &&
        facts["gst_number"][2, 10] == facts["pan_number"] && %w[regular composition other].include?(facts["gst_scheme"])
      invalid! if facts["gst_scheme"] == "other" && facts["gst_reason"].blank?
    elsif %w[not_registered needs_review].include?(facts["gst_status"])
      invalid! unless facts["gst_number"].empty? && facts["gst_scheme"].empty? && facts["gst_reason"].present?
    else
      invalid!
    end
  end

  def self.invalid!
    raise Payroll::ConsultantReview::InvalidInput, "Provide explicit, correctly formatted billing and tax facts"
  end
  private_class_method :validate_pan!, :validate_gst!, :invalid!
end
