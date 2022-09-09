# frozen_string_literal: true

class Recruitments::CandidatePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    true
  end

  def items?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def show?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def create?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def new_invoice_line_items?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def update?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def destroy?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def allowed_users?
    user_owner_role? || user_admin_role? || (user_employee_role? && user_under_sales_department?)
  end

  def permitted_attributes
    [
      :name,
      :title,
      :first_name,
      :last_name,
      :email,
      :address,
      :country,
      :description,
      :cover_letter,
      :discarded_at,
      :linkedinid,
      :skypeid,
      :mobilephone,
      :telephone,
      :status_code,
      :assignee_id,
      :reporter_id,
      :created_by_id,
      :updated_by_id,
      :preferred_contact_method_code,
      :initial_communication,
      :source_code,
      :company_id,
      :consultancy_id,
      tech_stack_ids: [],
      emails: []
    ]
  end
end
