# frozen_string_literal: true

class InvitationPolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role? || user_team_lead?
  end

  def edit?
    user_owner_role? || user_admin_role? || user_team_lead?
  end

  def update?
    user_owner_role? || user_admin_role? || user_team_lead?
  end

  def destroy?
    user_owner_role? || user_admin_role? || user_team_lead?
  end

  def permitted_attributes
    [:first_name, :last_name, :recipient_email, :role, :team_lead, :department_id]
  end
end
