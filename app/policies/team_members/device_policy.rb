# frozen_string_literal: true

class TeamMembers::DevicePolicy < ApplicationPolicy
  def show?
    user.has_any_role?(
      { name: :admin, resource: record.company },
      { name: :owner, resource: record.company }) || user == record.user
  end

  def update?
    user.has_any_role?(
      { name: :admin, resource: record.company },
      { name: :owner, resource: record.company }) || user == record.user
  end

  def create?
    user.has_any_role?(
      { name: :admin, resource: record.company },
      { name: :owner, resource: record.company }) || user == record.user
  end
end
