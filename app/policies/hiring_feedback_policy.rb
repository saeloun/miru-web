# frozen_string_literal: true

class HiringFeedbackPolicy < ApplicationPolicy
  def index? = HiringInterviewPolicy.new(user, HiringInterview).index?

  def show?
    return false unless user && record.company_id == user.current_workspace_id

    member = record.hiring_panel_member
    issued = record.panel_snapshot
    member && member.company_id == record.company_id && member.id == record.issued_panel_member_id &&
      member.employment_id == issued["employment_id"] && issued["panel_member_id"] == member.id &&
      HiringPolicy.staff_members(record.company).where(user_id: user.id, id: member.employment_id).exists? &&
      (record.submitted_at.present? || record.open?)
  end
end
