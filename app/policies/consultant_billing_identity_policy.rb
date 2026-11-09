# frozen_string_literal: true

class ConsultantBillingIdentityPolicy < ApplicationPolicy
  def show?
    available? && (self? && (configured? || history?) || reviewer?) && (enabled? || history?)
  end

  def submit?
    record_submission? && enabled?
  end

  def record_submission?
    available? && self? && (configured? || history?)
  end

  def review?
    available? && !self? && reviewer? && history?
  end

  private

    def available?
      user && user.current_workspace_id == record.company_id && User.kept.exists?(id: user.id, current_workspace_id: record.company_id) &&
        User.kept.exists?(id: record.user_id) && Employment.kept.exists?(id: record.id, company_id: record.company_id, user_id: record.user_id) &&
        !ConsultantBillingSubmission.where(company_id: record.company_id, employment_id: record.id).where.not(actor_id: record.user_id).exists?
    end

    def self?
      record.user_id == user.id
    end

    def enabled?
      Payroll::Entitlement.enabled?(record.company_id)
    end

    def configured?
      record.consultant_compensations.exists?
    end

    def history?
      ConsultantBillingSubmission.exists?(company_id: record.company_id, employment_id: record.id, actor_id: record.user_id)
    end

    def reviewer?
      today = record.company.resolved_time_zone.today
      return false unless Employment.kept.where(company_id: record.company_id, user_id: user.id, joined_at: ..today)
        .where("resigned_at IS NULL OR resigned_at >= ?", today).exists?

      roles = user.roles.where(resource_type: "Company", resource_id: record.company_id)
      roles.where(name: %w[owner admin]).exists? || roles.where(name: "book_keeper").exists? &&
        PayrollRun.exists?(company_id: record.company_id, accounts_reviewer_id: user.id)
    end
end
