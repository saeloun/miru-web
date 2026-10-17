# frozen_string_literal: true

class PayrollRunPolicy < ApplicationPolicy
  attr_reader :workspace_id

  def initialize(user, record)
    super
    @workspace_id = user.current_workspace_id
  end

  def index?
    active_member? && roles.exists?
  end

  def show?
    index? && record.company_id == workspace_id &&
      (roles.where(name: "owner").exists? || record.accounts_reviewer_id == user.id)
  end

  alias_method :preflight?, :show?

  def roles
    user.roles.where(resource_type: "Company", resource_id: workspace_id, name: %w[owner admin book_keeper])
  end

  def active_member?
    workspace_id.present? && User.kept.exists?(id: user.id, current_workspace_id: workspace_id) &&
      Employment.kept.where(user_id: user.id, company_id: workspace_id, joined_at: ..Date.current)
        .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists?
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      policy = PayrollRunPolicy.new(@user, PayrollRun)
      return @scope.none unless policy.index?

      company_runs = @scope.where(company_id: policy.workspace_id)
      policy.roles.where(name: "owner").exists? ? company_runs : company_runs.where(accounts_reviewer_id: @user.id)
    end
  end
end
