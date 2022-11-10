# frozen_string_literal: true

class TimeTrackingPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    user_employee_role? || user_owner_role? || user_admin_role?
  end
end
