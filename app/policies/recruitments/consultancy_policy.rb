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
      :name, :email, :address, :phone
    ]
  end
end
