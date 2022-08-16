# frozen_string_literal: true

class Users::DevicePolicy < ApplicationPolicy
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
    index?
  end
end
