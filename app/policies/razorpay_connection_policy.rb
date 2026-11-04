# frozen_string_literal: true

class RazorpayConnectionPolicy < ApplicationPolicy
  def manage?
    record.present? && user.kept? && user.current_workspace_id == record.id &&
      record.employments.kept.where(user_id: user.id)
        .where("joined_at IS NULL OR joined_at <= ?", Date.current)
        .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
      user.roles.where(resource: record, name: %w[owner admin]).exists?
  end
end
