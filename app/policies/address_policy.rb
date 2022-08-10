# frozen_string_literal: true

class AddressPolicy < ApplicationPolicy
  def index?
    if record.is_a?(User)
      (record.employed_at?(user.current_workspace_id) &&
      user_is_admin_or_owner_in_current_workspace?) || record == user
    elsif record.is_a?(Company)
      user_is_admin_or_owner_in_current_workspace? && record.id == user.current_workspace_id
    end
  end

  def create?
    index?
  end

  def show?
    if record.addressable_type == "User"
      (User.find_by(id: record.addressable_id).employed_at?(user.current_workspace_id) &&
      user_is_admin_or_owner_in_current_workspace?) || user.id == record.addressable_id
    else
      user_is_admin_or_owner_in_current_workspace? && record.addressable_id == user.current_workspace_id
    end
  end

  def update?
    show?
  end

  private

    def user_is_admin_or_owner_in_current_workspace?
      user.has_any_role?(
        { name: :admin, resource: user.current_workspace },
        { name: :owner, resource: user.current_workspace })
    end
end
