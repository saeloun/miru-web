# frozen_string_literal: true

class TimeoffEntryPolicy < ApplicationPolicy
  def index?
    user_has_any_workspace_role?
  end

  def create?
    user_has_any_workspace_role?
  end

  def update?
    week_over? ? user_has_admin_or_owner_role? : user_has_any_workspace_role?
  end

  def destroy?
    update?
  end

  def permitted_attributes
    [:duration, :note, :leave_date, :user_id, :leave_type_id, :holiday_info_id]
  end

  private

    def week_over?
      record.leave_date.present? && Time.current > record.leave_date.end_of_week(:sunday)
    end

    def user_has_any_workspace_role?
      user.has_any_role?(
        { name: :admin, resource: user.current_workspace },
        { name: :owner, resource: user.current_workspace },
        { name: :employee, resource: user.current_workspace }
      )
    end

    def user_has_admin_or_owner_role?
      user.has_any_role?(
        { name: :admin, resource: user.current_workspace },
        { name: :owner, resource: user.current_workspace }
      )
    end
end
