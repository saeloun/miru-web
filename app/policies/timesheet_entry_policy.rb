# frozen_string_literal: true

class TimesheetEntryPolicy < ApplicationPolicy
  def show?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def index?
    show?
  end

  def create?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def update?
    (record.user_id == user.id && !record.billed?) ||
      user.has_role?(:owner, record.project.client.company) || user.has_role?(:admin, record.project.client.company)
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
      if user_owner_role? || user_admin_role?
        scope = user.current_workspace.timesheet_entries.kept
      else
        scope = user.timesheet_entries.kept.in_workspace(user.current_workspace)
      end
    end
  end
end
