# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def index?
    can_access?
  end

  def create? # API
    true
  end

  def update? # API
    true
  end

  def find? # API
    true
  end

  def update_availability? # API
    true
  end

  def can_access?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def permitted_attributes
    [:available, :base_os, :brand, :device_type, :manufacturer, :meta_details, :name, :serial_number, :specifications,
     :version, :assignee_id, :version_id]
  end
end
