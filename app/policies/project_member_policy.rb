# frozen_string_literal: true

class ProjectMemberPolicy < ApplicationPolicy
  def update?
    user_owner_role? || user_admin_role?
  end
end
