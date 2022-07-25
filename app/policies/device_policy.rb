# frozen_string_literal: true

class DevicePolicy < ApplicationPolicy
  def show?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || record_belongs_to_user?
  end

  def update?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || record_belongs_to_user?
  end

  def create?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace },
      { name: :employee, resource: user.current_workspace })
  end
end
