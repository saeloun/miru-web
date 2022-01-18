# frozen_string_literal: true

class CompanyController < ApplicationController
  skip_before_action :validate_company!, only: [:create, :new]
  before_action :company_validation, only: [:new, :create]

  def new
    render :new
  end

  def create
    company = Company.create(company_params)
    current_user.company_id = company.id
    current_user.save!
    if company.save
      redirect_to root_path
    else
      flash[:error] = "Company creation failed"
      Rails.logger.errors "DEBUG::COMPANY_CONTROLLER::CREATE"
    end
  end

  def edit
    @company = Company.find(current_user.company_id)
  end

  def update
    @company = Company.find(current_user.company_id)
    if @company.update(company_update_params)
      redirect_to "/company"
    end
  end

  def purge_companylogo
    @company = Company.find(current_user.company_id)
    @company.companylogo.destroy
    redirect_to "/company"
  end

  private
    def company_params
      params.permit(:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end, :date_format, :companylogo)
    end

    def company_update_params
      params.require(:company).permit(:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end, :date_format, :companylogo)
    end

    def company_validation
      if current_user.company.present?
        flash[:error] = "You already have a company"
        redirect_to root_path
      end
    end
end
