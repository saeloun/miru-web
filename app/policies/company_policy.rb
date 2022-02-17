# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  def new?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def show?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def permitted_attributes
    [:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end, :date_format, :logo]
  end
end
