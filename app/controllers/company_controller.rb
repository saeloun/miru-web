# frozen_string_literal: true

class CompanyController < ApplicationController
  skip_before_action :validate_company!, only: [:create, :new]
  before_action :company_validation, only: [:new, :create]

  def new
    render
  end

  def create
    company = Company.create!(company_params)
    current_user.company_id = company.id
    current_user.save!

    redirect_to root_path
  rescue
    flash[:error] = "Company creation failed"
    Rails.logger.errors "DEBUG::COMPANY_CONTROLLER::CREATE"
  end

  private
    def company_params
      params.permit(:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end, :date_format)
    end

    def company_validation
      if current_user.company.present?
        flash[:error] = "You already have a company"
        redirect_to root_path
=======
end
