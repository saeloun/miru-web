# frozen_string_literal: true

class TimesheetEntryPolicy < ApplicationPolicy
  def show?
    true
  end

  def index?
    show?
  end

  def create?
    true
  end

  def update?
    record.user_id == user.id || user.has_owner_or_admin?
  end

  def destroy?
    update?
  end

  class Scope < ApplicationPolicy
    attr_reader :user, :timesheet_entry, :company

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if user_owner_or_admin?
        scope = user.current_workspace.timesheet_entries
      else
        scope = user.timesheet_entries
      end
    end
  end
end
