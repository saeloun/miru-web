# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def permitted_attributes
    [:available, :base_os, :brand, :device_type, :manufacturer, :meta_details, :name, :serial_number, :specifications,
     :version, :assignee_id, :company_id, :user_id, :version_id]
  end
end
