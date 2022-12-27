# frozen_string_literal: true

class EmploymentPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [:fixed_working_hours, :balance_pto]
  end
end
