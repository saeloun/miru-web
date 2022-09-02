# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def index?
    can_access_all_users?
  end

  def create?
    owner_admin_access?
  end

  def update?
    owner_admin_access?
  end

  def destroy?
    owner_admin_access?
  end

  def items?
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
    [:available, :base_os, :brand, :device_type, :manufacturer, :meta_details, :name, :serial_number, :specifications,
     :version, :assignee_id, :company_id, :user_id, :version_id]
  end
end
