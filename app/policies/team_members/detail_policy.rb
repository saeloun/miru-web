# frozen_string_literal: true

class TeamMembers::DetailPolicy < ApplicationPolicy
  def show?
    (user.has_any_role? :admin, :owner) || user == record.user
  end

  def update?
    (user.has_any_role? :admin, :owner) || user == record.user
  end
end
