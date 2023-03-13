# frozen_string_literal: true

class TeamMembers::DetailPolicy < ApplicationPolicy
  def show?
    return false unless record.present?
    user.has_any_role?(
      { name: :admin, resource: record.company },
      { name: :owner, resource: record.company }) || user == record.user
  end

  def update?
    return false unless record.present?
    user.has_any_role?(
      { name: :admin, resource: record.company },
      { name: :owner, resource: record.company }) || user == record.user
  end
end
