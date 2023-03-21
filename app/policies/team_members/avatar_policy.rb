# frozen_string_literal: true

class TeamMembers::AvatarPolicy < ApplicationPolicy
  def update?
    return false unless record.present?

    user_is_admin_or_owner? || user == record.user
  end

  def destroy?
    return false unless record.present?

    user_is_admin_or_owner? || user == record.user
  end

  private

    def user_is_admin_or_owner?
      user_owner_role? || user_admin_role?
    end
end
