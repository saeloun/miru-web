# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  def index?
    user.employed_at?(user.current_workspace_id)
  end

  def create?
    index?
  end

  def show?
    record.user.employed_at?(user.current_workspace_id) && record_belongs_to_user?
  end

  def update?
    show?
  end
end
