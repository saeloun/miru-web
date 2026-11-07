# frozen_string_literal: true

class HiringSetting < ApplicationRecord
  TEXT_FIELDS = %w[company_intro working_arrangements working_week overlap pto hiring_process
    acknowledgement_subject acknowledgement_body].freeze
  INTERVIEW_FIELDS = HiringMessage::INTERVIEW_KINDS.flat_map { |kind| ["#{kind}_subject", "#{kind}_body"] }.freeze
  FEEDBACK_FIELDS = HiringMessage::FEEDBACK_KINDS.flat_map { |kind| ["#{kind}_subject", "#{kind}_body"] }.freeze
  DECISION_FIELDS = HiringMessage::DECISION_KINDS.flat_map { |kind| ["#{kind}_subject", "#{kind}_body"] }.freeze

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
      allowed = TEXT_FIELDS + INTERVIEW_FIELDS + FEEDBACK_FIELDS + DECISION_FIELDS + %w[client_count feedback_notifications_enabled feedback_mailbox_id
        rejection_automation_enabled hold_notifications_enabled decision_mailbox_id]
      valid = (details.keys - allowed).empty? && (TEXT_FIELDS + INTERVIEW_FIELDS + FEEDBACK_FIELDS + DECISION_FIELDS).all? do |field|
        valid_text?(details[field], field.end_with?("_subject") ? 200 : 5_000) &&
          (!field.end_with?("_subject") || details[field].nil? || !details[field].match?(/[[:cntrl:]]/))
      end
      count = details["client_count"]
      valid &&= count.nil? || count.is_a?(Integer) && count.between?(0, 1_000_000)
      enabled = details["feedback_notifications_enabled"]
      mailbox = details["feedback_mailbox_id"]
      valid &&= enabled.nil? || [true, false].include?(enabled)
      valid &&= mailbox.nil? || mailbox.is_a?(Integer) && mailbox.positive?
      valid &&= mailbox.present? && FEEDBACK_FIELDS.all? { |key| details[key].present? } if enabled == true
      decision_mailbox = details["decision_mailbox_id"]
      valid &&= decision_mailbox.nil? || decision_mailbox.is_a?(Integer) && decision_mailbox.positive?
      { "rejection_automation_enabled" => "rejection", "hold_notifications_enabled" => "hold_follow_up" }.each do |flag, kind|
        value = details[flag]
        valid &&= value.nil? || [true, false].include?(value)
        valid &&= decision_mailbox.present? && %w[subject body].all? { |part| details["#{kind}_#{part}"].present? } if value == true
      end
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
