# frozen_string_literal: true

class LeavePolicy < ApplicationPolicy
  def index?
    has_owner_or_admin_role?
  end

  def create?
    has_owner_or_admin_role?
  end

  def update?
    authorize_current_user
  end

  def permitted_attributes
    [
      :year
    ]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    has_owner_or_admin_role?
  end
end
