# frozen_string_literal: true

class DeviceUsagePolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def approve?
    true
  end

  def permitted_attributes
    [:device_id, :assignee_id, :created_by_id, :approve]
  end
end
