# frozen_string_literal: true

class HiringPolicy < ApplicationPolicy
  def index? = EmployeeRecordPolicy.new(user, EmployeeRecord).manage?
  alias_method :create?, :index?

  def show? = index? && record.company_id == user.current_workspace_id
  alias_method :update?, :show?

  def self.staff_members(company)
    staff_ids = Role.joins(:users).where(resource: company, name: Employment::STAFF_ROLES).select("users.id")
    Employment.kept.joins(:user).merge(User.kept).where(company:, user_id: staff_ids)
      .where("employments.joined_at IS NULL OR employments.joined_at <= ?", Date.current)
      .where("employments.resigned_at IS NULL OR employments.resigned_at >= ?", Date.current)
  end

  def self.administrators(company)
    users = Role.joins(:users).where(resource: company, name: %w[owner admin]).select("users.id")
    staff_members(company).where(user_id: users)
  end
end
