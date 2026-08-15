# frozen_string_literal: true

class Api::V1::AuditLogsController < Api::V1::ApplicationController
  SENSITIVE_KEY_PATTERN = %r{
    password|token|secret|digest|credential|api[_-]?key|account_number|
    routing_number|swift_code|taxpayer_id|tax_id|otp|recovery_code|ciphertext
  }ix

  def index
    authorize :audit_log, :index?

    invalid = [:from, :to].find { |name| params[name].present? && parsed_date(name).nil? }
    return render json: { errors: "#{invalid} must be a valid ISO 8601 date" }, status: 400 if invalid

    audits = company_audits
    audits = audits.where(auditable_type: params[:auditable_type]) if params[:auditable_type].present?
    audit_action = request.query_parameters["action"]
    audits = audits.where(action: audit_action) if audit_action.present?
    audits = audits.where(user_id: params[:user_id]) if params[:user_id].present?
    audits = audits.where(created_at: parsed_date(:from).beginning_of_day..) if params[:from].present?
    audits = audits.where(created_at: ..parsed_date(:to).end_of_day) if params[:to].present?

    pagy, records = pagy(audits.preload(:auditable, :user).order(created_at: :desc), items: 25)

    render json: {
      audit_logs: records.map { |audit| serialize_audit(audit) },
      pagy: pagy_metadata(pagy)
    }
  end

  private

    def company_audits
      Audited::Audit.where(associated: current_company)
        .or(Audited::Audit.where(auditable: current_company))
    end

    def parsed_date(name)
      @parsed_dates ||= {}
      return @parsed_dates[name] if @parsed_dates.key?(name)

      @parsed_dates[name] = begin
        Date.iso8601(params[name])
      rescue Date::Error
        nil
      end
    end

    def serialize_audit(audit)
      {
        id: audit.id,
        auditable_type: audit.auditable_type,
        auditable_id: audit.auditable_id,
        auditable_label: auditable_label(audit),
        action: audit.action,
        audited_changes: filter_sensitive_values(audit.audited_changes),
        user: serialize_user(audit),
        created_at: audit.created_at.iso8601
      }
    end

    def serialize_user(audit)
      return if audit.user.blank? && audit.username.blank?

      {
        name: audit.user&.full_name || audit.username,
        email: audit.user&.email || audit.username
      }
    end

    def auditable_label(audit)
      record = audit.auditable
      attribute = [:name, :full_name, :invoice_number, :recipient_email]
        .find { |name| record&.respond_to?(name) }
      label = record.public_send(attribute) if attribute

      label.presence || "#{audit.auditable_type} ##{audit.auditable_id}"
    end

    def filter_sensitive_values(value)
      case value
      when Hash
        value.each_with_object({}) do |(key, nested_value), filtered|
          filtered[key] = filter_sensitive_values(nested_value) unless key.to_s.match?(SENSITIVE_KEY_PATTERN)
        end
      when Array
        value.map { |nested_value| filter_sensitive_values(nested_value) }
      else
        value
      end
    end
end
