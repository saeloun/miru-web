# frozen_string_literal: true

class HiringInterviewPolicy < ApplicationPolicy
  def index?
    user && HiringPolicy.staff_members(user.current_workspace).exists?(user_id: user.id)
  end

  def show?
    HiringPolicy.new(user, record).show? || current_grants.exists?
  end

  def compensation?
    HiringPolicy.new(user, record).show? || current_grants.where(compensation_access: true).exists?
  end

  private

    def current_grants
      unless user && record.company_id == user.current_workspace_id && record.status == "planned" && record.hiring_application.stage == "interview"
        return HiringAccessGrant.none
      end

      staff_ids = HiringPolicy.staff_members(record.company).where(user_id: user.id).select(:id)
      record.hiring_access_grants.active.joins(:hiring_panel_member).where(hiring_panel_members: { employment_id: staff_ids })
    end
end
