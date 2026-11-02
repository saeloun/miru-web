# frozen_string_literal: true

class HiringSetting < ApplicationRecord
  TEXT_FIELDS = %w[company_intro working_arrangements working_week overlap pto hiring_process
    acknowledgement_subject acknowledgement_body].freeze

  belongs_to :company
  belongs_to :approved_by, class_name: "User", optional: true
  has_many :hiring_messages, dependent: :restrict_with_exception
  serialize :details, coder: JSON, type: Hash
  serialize :form_schema, coder: JSON
  encrypts :details
  encrypts :form_schema
  audited associated_with: :company, on: [:create, :update], only: [:approved_by_id, :approved_at]
  validate :valid_details
  validate :valid_form
  before_save :clear_approval, if: -> { will_save_change_to_details? || will_save_change_to_form_schema? }

  def complete?
    valid? && Hiring::Form.new(form).complete? && details["client_count"].is_a?(Integer) &&
      TEXT_FIELDS.all? { |field| details[field].is_a?(String) && details[field].present? }
  end

  def approved?
    !will_save_change_to_details? && !will_save_change_to_form_schema? && approved_at.present? && approved_by_id.present? && complete? &&
      HiringPolicy.administrators(company).where(user_id: approved_by_id).exists?
  end

  def form = form_schema || Hiring::Form.default_schema

  def acknowledgement_text
    body = [details.fetch("acknowledgement_body"), details.fetch("company_intro"), "Clients: #{details.fetch('client_count')}"]
    %w[working_arrangements working_week overlap pto hiring_process].each do |key|
      body << "#{key.humanize}: #{details.fetch(key)}"
    end
    body.join("\n\n")
  end

  private

    def valid_form
      errors.add(:form_schema, "contains invalid application fields") unless Hiring::Form.new(form).valid?
    end

    def valid_details
      allowed = TEXT_FIELDS + ["client_count"]
      valid = (details.keys - allowed).empty? && TEXT_FIELDS.all? do |field|
        valid_text?(details[field], field == "acknowledgement_subject" ? 200 : 5_000)
      end
      subject = details["acknowledgement_subject"]
      valid &&= subject.nil? || !subject.match?(/[[:cntrl:]]/)
      count = details["client_count"]
      valid &&= count.nil? || count.is_a?(Integer) && count.between?(0, 1_000_000)
      errors.add(:details, "contain invalid hiring email settings") unless valid
    end

    def valid_text?(value, maximum)
      return true if value.nil?
      return false unless value.is_a?(String) && value.length <= maximum && value.valid_encoding?

      value.encode("UTF-8")
      !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
    rescue EncodingError
      false
    end

    def clear_approval
      self.approved_at = nil
      self.approved_by = nil
    end
end
