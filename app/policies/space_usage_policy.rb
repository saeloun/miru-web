# frozen_string_literal: true

class SpaceUsagePolicy < ApplicationPolicy
  def show?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def create?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def update?
    record.user_id == user.id ||
      user.has_role?(:owner, record.company) || user.has_role?(:admin, record.company)
  end

  def destroy?
    update?
  end

  class Scope < ApplicationPolicy
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      user.current_workspace.space_usages
    end
  end
end
