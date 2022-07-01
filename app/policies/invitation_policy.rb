# frozen_string_literal: true

class InvitationPolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role?
  end

  def edit?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def destroy?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [:first_name, :last_name, :recipient_email, :role]
  end
end
