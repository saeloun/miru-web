# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def index?
    can_access?
  end

  def create?
    true
  end

  def update?
    true
  end

  def can_access?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?) || user_team_lead?
  end

  def permitted_attributes
    [:available, :base_os, :brand, :device_type, :manufacturer, :meta_details, :name, :serial_number, :specifications,
     :version, :assignee_id, :company_id, :user_id, :version_id]
  end
end
