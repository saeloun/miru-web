# frozen_string_literal: true

class Users::InvitationsPolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role?
  end
end
