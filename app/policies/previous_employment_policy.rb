# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  def show?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user_checks_his_own_previous_employment?
  end

  def update?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }) || user_checks_his_own_previous_employment?
  end

  def create?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace },
      { name: :employee, resource: user.current_workspace })
  end

  private

    def user_checks_his_own_previous_employment?
      user.id == record.user_id
    end
end
