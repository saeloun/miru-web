# frozen_string_literal: true

class TeamMembers::AvatarPolicy < ApplicationPolicy
  def update?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user == record
  end

  def destroy?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user == record
  end
end
