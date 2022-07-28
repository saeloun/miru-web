# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  def show?
    (record.user.employee_of?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })) || record_belongs_to_user?
  end

  def index?
    user.employee_of?(user.current_workspace_id) ||
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })
  end

  def update?
    show?
  end

  def create?
    index?
  end
end
