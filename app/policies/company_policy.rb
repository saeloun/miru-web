# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  attr_reader :error_message_key
  def index?
    user_owner_role? || user_admin_role?
  end

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

  def update_team_members?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [:name, :business_phone, :country, :timezone,
     :base_currency, :standard_price, :fiscal_year_end,
     :logo, :date_format, :working_days, :working_hours,
     addresses_attributes: [:id, :address_line_1, :address_line_2,
                            :city, :state, :country, :pin]
    ]
  end

  def purge_logo?
    user_owner_role? || user_admin_role?
  end
end
