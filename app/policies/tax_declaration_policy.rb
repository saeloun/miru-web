# frozen_string_literal: true

class TaxDeclarationPolicy < ApplicationPolicy
  def index?
    SalarySlipPolicy.new(user, SalarySlip).index? && PayrollRunPolicy.new(user, PayrollRun).active_member?
  end
  alias_method :create?, :index?

  def estimate?
    index? && Payroll::Entitlement.enabled?(user.current_workspace_id)
  end

  def manage?
    index? && has_owner_or_admin_role?
  end

  def show?
    index? && same_company? && (own? || manage?)
  end
  alias_method :download?, :show?

  def submit?
    index? && same_company? && own?
  end
  alias_method :revise?, :submit?
  alias_method :withdraw?, :submit?

  def review?
    manage? && same_company? && !own?
  end

  private

    def own?
      record.employment.user_id == user.id
    end

    def same_company?
      record.employment.company_id == user.current_workspace_id
    end
end
