# frozen_string_literal: true

class InvitationPolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [:first_name, :last_name, :recipient_email, :roles]
  end
end
