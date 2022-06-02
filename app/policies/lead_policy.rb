# frozen_string_literal: true

class LeadPolicy < ApplicationPolicy
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

  def update_line_items?
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
      :address, :base_currency, :budget_amount, :budget_status_code,
      :country, :description, :discarded_at, :donotbulkemail,
      :donotemail, :donotfax, :donotphone, :industry_code,
      :linkedinid, :mobilephone, :name, :other_email, :primary_email,
      :priority, :quality_code, :skypeid, :state_code, :status_code,
      :telephone, :timezone
    ]
  end
end
