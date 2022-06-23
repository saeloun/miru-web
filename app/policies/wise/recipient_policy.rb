# frozen_string_literal: true

class Wise::RecipientPolicy < ApplicationPolicy
  def show?
    user.current_workspace_id == record.id
  end

  def create?
    user.current_workspace_id == record.id
  end

  def update?
    user.current_workspace_id == record.id
  end
end
