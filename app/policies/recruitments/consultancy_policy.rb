# frozen_string_literal: true

class Recruitments::ConsultancyPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    true
  end

  def items?
    true
  end

  def show?
    user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def new_invoice_line_items?
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
      :name, :email, :address, :phone
    ]
  end
end
