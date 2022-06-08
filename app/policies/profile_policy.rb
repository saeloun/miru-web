# frozen_string_literal: true

class ProfilePolicy < ApplicationPolicy
  def index?
    true
  end

  def remove_avatar?
    user
  end

  def update?
    user
  end
end
