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

  def certify? # API
    true
  end
end
