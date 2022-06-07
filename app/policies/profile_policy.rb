# frozen_string_literal: true

class ProfilePolicy < ApplicationPolicy
  def index?
    true
  end

  def remove_avatar?
    true
  end

  def update?
    true
end
end
