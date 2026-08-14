# frozen_string_literal: true

class BulkPreviousEmploymentPolicy < ApplicationPolicy
  def update?
    return true if user_owner_role? || user_admin_role?
    return false unless user_employee_role?

    record.id == user.id
  end
end
