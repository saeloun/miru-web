# frozen_string_literal: true

class Users::DevicePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def show?
    owner_admin_or_employee? || record_belongs_to_user?
  end

  def update?
    show?
  end

  def index?
    owner_admin_or_employee? || record == user
  end

  def create?
    return true if owner_admin_or_employee?

    @error_message_key = :unauthorized_access
    false
  end

  private

    def owner_admin_or_employee?
      record.employed_at?(user.current_workspace_id) &&
        (user_admin_role? || user_owner_role?)
    end
end
