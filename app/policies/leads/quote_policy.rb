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
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def new_invoice_line_items?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def destroy?
    user_owner_or_admin?
  end

  def permitted_attributes
    [
      :name, :description,
      quote_line_items_attributes: [
        :id, :name, :description,
        :comment, :estimated_hours,
        :lead_line_item_id, :lead_quote_id,
        :number_of_resource, :resource_expertise_level, :_destroy
      ]
    ]
  end
end
