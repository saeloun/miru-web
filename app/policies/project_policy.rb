# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def show?
    user_owner_or_admin?
  end
  q
  def create?
    user_owner_or_admin?
  end
end
