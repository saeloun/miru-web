# frozen_string_literal: true

# Policy that gates destructive user operations to super admins only.
# Used by Api::V1::UsersController#destroy.
class SuperAdminUserPolicy < ApplicationPolicy
  def destroy?
    user.super_admin? && record.id != user.id
  end
end
