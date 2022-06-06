# frozen_string_literal: true

class ProfilePolicy < ApplicationPolicy
  def remove_avatar?
    true
  end

  def update?
    true
end
end
