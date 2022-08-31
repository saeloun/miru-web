# frozen_string_literal: true

class EngagementPolicy < ApplicationPolicy
  def index?
    can_access?
  end

  def edit?
    can_access?
  end

  def update?
    can_access?
  end

  def items?
    can_access?
  end

  def destroy?
    can_access?
  end

  def admin_access?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def can_access?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?) || user_team_lead?
  end

  def permitted_attributes
    [:first_name, :last_name, :email, :department_id, :avatar]
  end
end
