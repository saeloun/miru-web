# frozen_string_literal: true

class Leads::TimelinePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    true
  end

  def items?
    true
  end

  def show?
    can_access?
  end

  def create?
    can_access?
  end

  def new_invoice_line_items?
    can_access?
  end

  def update?
    can_access?
  end

  def destroy?
    can_access?
  end

  def can_access?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def permitted_attributes
    [
      :action_description,
      :action_due_at,
      :action_priority_code,
      :action_subject,
      :comment,
      :discarded_at,
      :index_system_display_message,
      :index_system_display_title,
      :kind,
      :action_assignee_id,
      :action_created_by_id,
      :action_reporter_id,
      :lead_id,
      :parent_lead_timeline_id,
      :action_email,
      :action_phone_number,
      :action_schedule_status_code
    ]
  end
end
