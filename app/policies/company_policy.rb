# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  def new?
    create?
  end

  def create?
    user.has_any_role?(:owner, :admin)
  end

  def show?
    user.has_any_role?(:owner, :admin)
  end

  def update?
    user.has_any_role?(:owner, :admin)
  end
end
