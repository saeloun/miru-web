# frozen_string_literal: true

class LeadPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    true
  end

  def items?
    true
  end

  def allowed_users?
    true
  end

  def show?
    user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def edit?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def destroy?
    user_owner_role? || user_admin_role?
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
