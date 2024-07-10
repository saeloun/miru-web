# frozen_string_literal: true

class TeamMembers::NotificationPreferencePolicy < ApplicationPolicy
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

      has_owner_or_admin_role? || record_belongs_to_user?
    end
end
