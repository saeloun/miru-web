# frozen_string_literal: true

class Users::InvitationsPolicy < ApplicationPolicy # TeamPolicy
  def create?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_hr_department?)
  end
end
