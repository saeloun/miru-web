# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  def edit?
    update?
  end

  def update?
    user.has_any_role?(:owner, :admin)
  end

  def destroy?
    user.has_any_role?(:owner, :admin)
  end
end
