# frozen_string_literal: true

class CompanyController < ApplicationController
  skip_before_action :validate_company!, only: [:create, :new]
  before_action :company_validation, only: [:new, :create]

  def new
    @company = Company.new
    render :new
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      current_user.company_id = @company.id
      current_user.save!

      redirect_to root_path, notice: "Company succesfully created"
    else
      flash.now[:error] = "Company creation failed"
      render :new, status: :bad_request
      Rails.logger.error "DEBUG::COMPANY_CONTROLLER::CREATE"
    end
  end

  def show
    @company = current_company
  end

  def update
    @company = current_company
    if @company.update(company_params)
      redirect_to "/company"
      flash[:notice] = "Company successfully updated"
    else
      render :show, status: :bad_request
    end
  end

  def purge_logo
    @company = current_company
    @company.logo.destroy
    redirect_to "/company"
  end

  private
    def company_params
      params.require(:company).permit(:name, :address, :business_phone, :country, :timezone, :base_currency, :standard_price, :fiscal_year_end, :date_format, :logo)
    end

    def company_validation
      if current_user.company.present?
        flash[:error] = "You already have a company"
        redirect_to root_path
      end
    end
end
