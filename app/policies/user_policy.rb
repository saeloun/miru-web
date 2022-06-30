# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def create?
    user_owner_role? || user_admin_role?
  end
end
