# frozen_string_literal: true

class Profiles::TeamMemberPolicy < ApplicationPolicy
  def index?
    can_access?
  end

  def show?
    can_access?
  end

  def update?
    can_access?
  end

  def can_access?
    user_owner_role? || user_admin_role? || user_team_lead?
  end
end
