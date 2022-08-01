# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  def show?
    (record.user.employed_at?(user.current_workspace_id) &&
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace }))
  end

  def index?
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
