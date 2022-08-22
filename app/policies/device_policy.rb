# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def permitted_attributes
    [:name, :version, :version_id, :kind, :device_company_name, :available, :assignee_id, :company_id]
  end
end
