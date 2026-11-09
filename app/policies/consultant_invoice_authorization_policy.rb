# frozen_string_literal: true

class ConsultantInvoiceAuthorizationPolicy < ApplicationPolicy
  def show?
    available? && (record? && (grant? || own_history?) || observer?)
  end

  def record?
    available? && record.user_id == user.id && (Payroll::Entitlement.enabled?(record.company_id) || own_history?)
  end
  alias_method :create?, :record?

  def grant?
    record? && Payroll::Entitlement.enabled?(record.company_id) && active_employment?(record) && configured? && subject_consistent?
  end

  def withdraw?
    record? && own_history? && current_event&.action == "grant"
  end

  private

    def available?
      user && user.current_workspace_id == record.company_id &&
        User.kept.exists?(id: user.id, current_workspace_id: record.company_id) &&
        User.kept.exists?(id: record.user_id) &&
        Employment.kept.exists?(id: record.id, company_id: record.company_id, user_id: record.user_id)
    end

    def active_employment?(employment)
      today = record.company.resolved_time_zone.today
      employment.joined_at.present? && employment.joined_at <= today &&
        (employment.resigned_at.nil? || employment.resigned_at >= today)
    end

    def configured?
      ConsultantCompensation.exists?(employment_id: record.id, effective_on: ..record.company.resolved_time_zone.today)
    end

    def current_event
      @current_event ||= ConsultantInvoiceAuthorization.heads.find_by(company_id: record.company_id, employment_id: record.id)
    end

    def own_history?
      current_event&.actor_id == user.id
    end

    def subject_consistent?
      current_event.nil? || own_history?
    end

    def observer?
      return false unless Payroll::Entitlement.enabled?(record.company_id)
      return false unless configured? || current_event
      return false unless user.employments.kept.where(company_id: record.company_id).any? { |employment| active_employment?(employment) }

      roles = user.roles.where(resource_type: "Company", resource_id: record.company_id)
      roles.where(name: %w[owner admin]).exists? || roles.where(name: "book_keeper").exists? &&
        PayrollRun.exists?(company_id: record.company_id, accounts_reviewer_id: user.id)
    end
end
