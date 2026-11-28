# frozen_string_literal: true

class PayrollRemittanceDocumentPolicy < ApplicationPolicy
  def index?
    user && user.current_workspace_id == record.id && User.kept.exists?(id: user.id, current_workspace_id: record.id) &&
      Employment.kept.exists?(company_id: record.id, user_id: user.id)
  end

  def show?
    return false unless user && user.current_workspace_id == record.company_id &&
      User.kept.exists?(id: user.id, current_workspace_id: record.company_id)

    subject = record.employment
    return false unless Employment.kept.exists?(id: subject.id, company_id: record.company_id) && User.kept.exists?(id: subject.user_id)
    return true if subject.user_id == user.id

    today = record.company.resolved_time_zone.today
    active = Employment.kept.where(company_id: record.company_id, user_id: user.id, joined_at: ..today)
      .where("resigned_at IS NULL OR resigned_at >= ?", today).exists?
    roles = user.roles.where(resource: record.company)
    active && (roles.where(name: %w[owner admin]).exists? || record.payroll_run.accounts_reviewer_id == user.id && roles.where(name: "book_keeper").exists?)
  end

  def create?
    show? && Payroll::Entitlement.enabled?(record.company_id) && record.submission_state == "accepted"
  end
end
