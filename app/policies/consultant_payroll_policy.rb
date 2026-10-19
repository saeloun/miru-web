# frozen_string_literal: true

class ConsultantPayrollPolicy < ApplicationPolicy
  def index?
    return false unless user && user.current_workspace&.id == user.current_workspace_id

    PayrollRunPolicy.new(user, PayrollRun).index? &&
      user.roles.where(resource: user.current_workspace, name: %w[owner admin]).exists?
  end
  alias_method :create?, :index?
  alias_method :preview?, :index?
  alias_method :history?, :index?
end
