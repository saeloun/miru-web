# frozen_string_literal: true

class DeviceUsagePolicy < ApplicationPolicy
  def demand?
    can_access_all_users?
  end

  def demand_cancel?
    can_access_all_users?
  end

  def approve?
    owner_admin_access?
  end

  def can_access_all_users?
    owner_admin_access? || user_employee_role?
  end

  def can_access?
    owner_admin_access? || (user_employee_role? && user_under_sales_department?) || user_team_lead?
  end

  def owner_admin_access?
    user_owner_role? || user_admin_role?
  end

  def admin_access?
    owner_admin_access? || (user_employee_role? && user_under_sales_department?)
  end

  def permitted_attributes
    [:device_id, :assignee_id, :created_by_id, :approve]
  end
end
