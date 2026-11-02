# frozen_string_literal: true

class CompensationProfitabilityPolicy < ApplicationPolicy
  def show?
    return false unless user && record && user.current_workspace_id == record.id && record.pro_access?

    User.kept.exists?(id: user.id, current_workspace_id: record.id) &&
      record.employments.kept.where(user_id: user.id)
        .where("joined_at IS NULL OR joined_at <= ?", Date.current)
        .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
      Role.joins(:users).where(users: { id: user.id }, resource: record, name: %w[owner admin]).exists?
  end

  alias_method :configure?, :show?
  alias_method :download?, :show?
end
