# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    user_owner_role? || user_admin_role?
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def permitted_attributes
    [:first_name, :last_name]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    return false if owner_removing_self?
    return false if admin_removing_owner?

    user_owner_role? || user_admin_role?
  end

  # Owners must transfer ownership before removing themselves.
  def owner_removing_self?
    return false unless record.user_id == user.id
    return false unless user.has_role?(:owner, record.company)

    @error_message_key = :owner_self_removal
    true
  end

  # Admins are not permitted to remove owners.
  def admin_removing_owner?
    return false unless user_admin_role?
    return false unless record.user.has_role?(:owner, record.company)

    @error_message_key = :admin_cannot_remove_owner
    true
  end
end
