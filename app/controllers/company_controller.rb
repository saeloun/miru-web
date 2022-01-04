# frozen_string_literal: true

class CompanyController < ApplicationController
  def new
  end

  def create
    company = Company.create!(company_params)
    current_user.company_id = company.id
    current_user.save!

    redirect_to root_path
  rescue
    logger.errors "DEBUG::COMPANY_CONTROLLER::CREATE"
  end

  private
    def company_params
      params.permit(:name, :address, :business_phone, :base_currency, :standard_price, :fiscal_year_end, :date)
    end
end
