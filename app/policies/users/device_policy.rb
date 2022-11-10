# frozen_string_literal: true

class Users::DevicePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def show?
    (record.issued_to.employed_at?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record_belongs_to_user?
  end

  def update?
    show?
  end

  def index?
    (record.employed_at?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record == user
  end

  def create?
    record.employed_at?(user.current_workspace_id) &&
      (user_admin_role? || user_owner_role?) || record == user
  end

  private

    def owner_admin_or_employee?
      record.employed_at?(user.current_workspace_id) ||
        (user_admin_role? || user_owner_role?)
    end
end
