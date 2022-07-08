# frozen_string_literal: true

class LeadPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    can_access?
  end

  def items?
    can_access?
  end

  def actions?
    can_access?
  end

  def timeline_items?
    can_access?
  end

  def allowed_users?
    can_access?
  end

  def show?
    can_access?
  end

  def create?
    can_access?
  end

  def edit?
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
      :address, :base_currency, :budget_amount, :budget_status_code,
      :country, :description, :discarded_at, :donotbulkemail,
      :donotemail, :donotfax, :donotphone, :industry_code,
      :linkedinid, :mobilephone, :name, :email,
      :quality_code, :skypeid, :state_code, :status_code,
      :telephone, :timezone, :assignee_id, :reporter_id, :created_by_id,
      :updated_by_id, :need, :preferred_contact_method_code,
      :initial_communication, :first_name, :last_name,
      :source_code, :priority_code, :title, :company_id,
      tech_stack_ids: [], emails: []
    ]
  end
end
