# frozen_string_literal: true

class ProjectMemberPolicy < ApplicationPolicy
  def update?
    user_owner_or_admin?
  end
end
