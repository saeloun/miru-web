# frozen_string_literal: true

class AddressPolicy < ApplicationPolicy
  def show?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user_checks_his_own_address?
  end

  def update?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user_checks_his_own_address?
  end

  private

    def user_checks_his_own_address?
      user.id == record.addressable_id && record.addressable_type == "User"
    end
end
