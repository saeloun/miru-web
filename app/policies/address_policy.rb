# frozen_string_literal: true

class AddressPolicy < ApplicationPolicy
  def show?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user.id == record.addressable_id
  end

  def update?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user.id == record.addressable_id
  end
end
