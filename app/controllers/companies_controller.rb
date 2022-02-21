# frozen_string_literal: true

class CompaniesController < ApplicationController
  skip_before_action :validate_company!, only: [:create, :new]
  before_action :company_validation, only: [:new, :create]

  def new
    @company = Company.new
    authorize @company
    render :new
  end

  def create
    @company = Company.new(permitted_attributes(Company))
    authorize @company
    if @company.save
      current_user.companies << @company
      current_user.current_workspace_id = @company.id
      current_user.save!

      redirect_to root_path, notice: t(".success")
    else
      flash.now[:error] = t(".failure")
      render :new, status: :unprocessable_entity
      Rails.logger.error "DEBUG::COMPANY_CONTROLLER::CREATE"
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

  private
    def company_validation
      if current_user.companies.present?
        flash[:error] = "You already have a company"
        redirect_to root_path
      end
    end
end
