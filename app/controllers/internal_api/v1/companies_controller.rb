# frozen_string_literal: true

class InternalApi::V1::CompaniesController < InternalApi::V1::ApplicationController
  def index
    authorize current_company
    render :index, locals: { current_company:, client_list: current_company.client_list }, status: :ok
  end

  def create
    authorize Company
    if CreateCompanyService.new(current_user, params: company_params).process
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
