# frozen_string_literal: true

class Leads::QuotePolicy < ApplicationPolicy
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
      :name, :description,
      :status, :status_comment,
      quote_line_items_attributes: [
        :id, :name, :description,
        :comment, :estimated_hours,
        :lead_line_item_id, :lead_quote_id,
        :number_of_resource, :resource_expertise_level, :_destroy
      ]
    ]
  end
end
