# frozen_string_literal: true

class HiringAssignmentPolicy < ApplicationPolicy
  def index?
    user&.current_workspace.present? && HiringPolicy.staff_members(user.current_workspace).exists?(user_id: user.id)
  end

  def show?
    user.present? && user.current_workspace_id == record.company_id && record.active? &&
      HiringPolicy.staff_members(record.company).exists?(id: record.reviewer_employment_id, user_id: user.id)
  end

  def review?
    show? && %w[submitted reviewed].include?(record.status) && record.submission.submitted_at?
  end
end
