# frozen_string_literal: true

class LeaveWithLeaveTypesPolicy < ApplicationPolicy
  def update?
    has_owner_or_admin_role?
  end
end
