# frozen_string_literal: true

class InternalApi::V1::CompaniesController < InternalApi::V1::ApplicationController
  def index
    authorize current_company
    render json: { company: current_company }
  end

  def create
    authorize Company
    company = Company.new(company_params)
    if company.save!
      current_user.companies << company
      current_user.current_workspace_id = company.id
      current_user.add_role(:owner, company)
      current_user.save!
      render json: { notice: I18n.t("companies.create.success") }
    end
  end

  def update
    authorize current_company
    if current_company.update!(company_params)
      render json: { notice: I18n.t("companies.update.success") }
    end
  end

  private

    def company_params
      params.require(:company).permit(
        :name, :address, :business_phone, :country, :timezone, :base_currency,
        :standard_price, :fiscal_year_end, :date_format, :logo
      )
    end
end
