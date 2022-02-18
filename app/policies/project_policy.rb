# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def create?
    user_owner_or_admin?
  end
end
