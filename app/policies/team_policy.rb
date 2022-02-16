# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  def index?
    user.has_any_role?(:owner, :admin)
  end

  def edit?
    update?
  end

  def update?
    user.has_any_role?(:owner, :admin)
  end

  def delete?
    user.has_any_role?(:owner, :admin)
  end
end
