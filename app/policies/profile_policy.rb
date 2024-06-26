# frozen_string_literal: true

class ProfilePolicy < ApplicationPolicy
  def update?
    user
  end
end
