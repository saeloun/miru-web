# frozen_string_literal: true

class CompaniesController < ApplicationController
  def new
    @company = Company.new
    authorize @company
    render :new
  end

  def create
    company = Company.new(permitted_attributes(Company))
    authorize company
    begin
      CreateCompanyService.new(current_user, company:).process
      redirect_to root_path, notice: t(".success")
    rescue => e
      flash.now[:error] = t(".failure")
      render :new, status: :unprocessable_entity
    end
  end

  def show
    authorize current_company
  end

  def update
    authorize current_company
    if current_company.update(permitted_attributes(current_company))
      redirect_to company_path
      flash[:notice] = t(".success")
    else
      render :show, status: :unprocessable_entity
    end
  end
end
