# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def create?
    user_owner_or_admin?
  end
end
