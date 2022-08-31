# frozen_string_literal: true

class DeviceApi::DeviceApiPolicy < ApplicationPolicy
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
     :version, :assignee_id, :company_id, :user_id, :version_id]
  end
end
