# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def create?
    user.has_any_role?(:owner, :admin)
  end
end
