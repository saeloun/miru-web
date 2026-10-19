# frozen_string_literal: true

class ConsultantPayrollPolicy < ApplicationPolicy
  def index?
    user&.current_workspace&.id == user&.current_workspace_id && SalarySlipPolicy.new(user, SalarySlip).create?
  end
  alias_method :create?, :index?
  alias_method :preview?, :index?
  alias_method :history?, :index?
end
