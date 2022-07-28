# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  def show?
    (record_user_employee_of?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record_belongs_to_user?
  end

  def update?
    (record_user_employee_of?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record_belongs_to_user?
  end

  def create?
    (record_user_employee_of?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record_belongs_to_user?
  end

  private

    def record_user_employee_of?(company_id)
      record.user.employments.pluck(:company_id).include?(company_id)
    end
end
