# frozen_string_literal: true

class BulkPreviousEmploymentPolicy < ApplicationPolicy
  def update?
    user_owner_role? || user_admin_role? || user_employee_role?
  end
end
