# frozen_string_literal: true

class TimesheetEntryPolicy < ApplicationPolicy
  attr_reader :user, :timesheet_entry

  def initialize(user, timesheet_entry)
    @user = user
    @timesheet_entry = timesheet_entry
  end

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
    timesheet_entry.user == user
  end

  def destroy?
    update?
  end
end
