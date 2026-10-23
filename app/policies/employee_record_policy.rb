# frozen_string_literal: true

class EmployeeRecordPolicy < ApplicationPolicy
  STAFF_ROLES = %w[owner admin manager employee book_keeper].freeze

  def index?
    active_employments.where(user_id: user.id).exists? &&
      User.kept.exists?(id: user.id, current_workspace_id: workspace_id) && staff_roles(user.id).exists?
  end

  def show?
    index? && record.company_id == workspace_id && active_employments.where(id: record.id).exists? &&
      staff_roles(record.user_id).exists? && (manage? || record.user_id == user.id)
  end
  alias_method :update?, :show?

  def manage?
    index? && staff_roles(user.id).where(name: %w[owner admin]).exists?
  end

  def active_employments
    Employment.kept.joins(:user).merge(User.kept).where(company_id: workspace_id)
      .where("joined_at IS NULL OR joined_at <= ?", Date.current)
      .where("resigned_at IS NULL OR resigned_at >= ?", Date.current)
  end

  private

    def workspace_id
      user.current_workspace_id
    end

    def staff_roles(user_id)
      Role.joins(:users).where(users: { id: user_id }, resource_type: "Company", resource_id: workspace_id,
        name: STAFF_ROLES)
    end
end
