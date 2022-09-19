# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def new?
    true
  end

  def create?
    true
  end

  def show?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def company_present?
    if user.present? && user.current_workspace.nil?
      @error_message_key = :company_not_present
      return false
    end

    true
  end

  def users?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end,
     :date_format, :logo]
  end

  def purge_logo?
    user_owner_role? || user_admin_role?
  end
end
