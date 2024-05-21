# frozen_string_literal: true

class HolidayPolicy < ApplicationPolicy
  def update?
    admin_access?
  end

  def index?
    admin_access? || user_employee_role?
  end

  def admin_access?
    user_owner_role? || user_admin_role?
  end
end
