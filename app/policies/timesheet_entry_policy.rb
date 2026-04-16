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

  def bulk_update?
    create?
  end

  def bulk_destroy?
    create?
  end

  def update?
    return false if stale_entry_for_non_admin?
    return true if privileged_role_for_record?

    record.user_id == user.id && !record.billed?
  end

  def destroy?
    update?
  end

  private

    def privileged_role_for_record?
      user.has_role?(:owner, record.project.client.company) ||
        user.has_role?(:admin, record.project.client.company)
    end

    def stale_entry_for_standard_user?
      return false if record.work_date.blank?

      record.work_date < 7.days.ago.to_date
    end

    def stale_entry_for_non_admin?
      stale_entry_for_standard_user? &&
        !user.has_role?(:admin, record.project.client.company)
    end

    class Scope < ApplicationPolicy
      attr_reader :user, :scope

      def initialize(user, scope)
        @user = user
        @scope = scope
      end

      def resolve
        if user_owner_role? || user_admin_role?
          user.current_workspace.timesheet_entries.kept
        else
          user.timesheet_entries.kept.in_workspace(user.current_workspace)
        end
      end
    end
end
