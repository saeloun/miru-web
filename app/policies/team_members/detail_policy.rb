# frozen_string_literal: true

class TeamMembers::DetailPolicy < ApplicationPolicy
  def show?
    return false unless record.present?

    authorize_current_user
  end

  def update?
    return false unless record.present?

    authorize_current_user
  end

  private

    def authorize_current_user
      unless user.current_workspace_id == record.company_id
        @error_message_key = :different_workspace
        return false
      end

      user_owner_role? || user_admin_role?
    end
end
