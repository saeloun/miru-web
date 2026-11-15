# frozen_string_literal: true

class PayrollConsultantInvoicePolicy < ApplicationPolicy
  def index?
    record.is_a?(Employment) ? own_subject?(record) : manager?
  end

  def runs?
    available? && record.is_a?(Company) && Payroll::Entitlement.enabled?(record.id) &&
      Employment.kept.where(company_id: record.id, user_id: user.id, joined_at: ..Date.current)
        .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
      user.roles.where(resource: record, name: %w[owner admin book_keeper]).exists?
  end

  def show?
    own_subject?(record.employment) || manager?
  end
  alias_method :download?, :show?

  def configure?
    return false unless manager? && record.employment.user_id != user.id

    review? || user.roles.where(resource: run.company, name: %w[owner admin]).exists?
  end

  def review?
    available? && Payroll::ConsultantInvoicePreparation.new(run, actor: user).reviewer?(record.employment)
  end

  def submit_existing?
    own_subject?(record.employment) && Payroll::Entitlement.enabled?(record.company_id)
  end

  private

    def run
      record.is_a?(PayrollRun) ? record : record.payroll_run
    end

    def available?
      company_id = record.is_a?(Company) ? record.id : record.company_id
      user && User.kept.exists?(id: user.id, current_workspace_id: company_id) && user.current_workspace_id == company_id
    end

    def own_subject?(employment)
      available? && employment && employment.user_id == user.id &&
        Employment.kept.exists?(id: employment.id, company_id: record.company_id, user_id: user.id)
    end

    def manager?
      available? && run && run.company_id == record.company_id && run.eligible_actor?(user, "accounts") &&
        (run.accounts_reviewer_id == user.id || user.roles.where(resource: run.company, name: %w[owner admin]).exists?)
    end
end
