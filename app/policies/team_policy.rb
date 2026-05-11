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

    return false if only_owner_removing_self?

    user_owner_role? || user_admin_role?
  end

  def only_owner_removing_self?
    return false unless record.user_id == user.id
    return false unless user.has_role?(:owner, record.company)

    is_last_owner = owner_role_count_for_company <= 1
    @error_message_key = :last_owner_self_removal if is_last_owner
    is_last_owner
  end

  def owner_role_count_for_company
    User
      .joins(:roles, :employments)
      .where(roles: { name: "owner", resource_type: "Company", resource_id: record.company_id })
      .merge(User.kept)
      .merge(Employment.kept.where(company_id: record.company_id))
      .distinct
      .count
  end
end
