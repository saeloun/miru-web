# frozen_string_literal: true

class EmploymentPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end
end
