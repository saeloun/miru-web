# frozen_string_literal: true

class InternalApi::V1::CompaniesController < InternalApi::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token, only: :create

  def index
    authorize current_company
    render :index, locals: {
      current_company:, client_list: current_company.client_list, address: current_company.address
    }, status: :ok
  end

  def create
    authorize Company
    company = CreateCompanyService.new(current_user, params: company_params).process
    if company
      render json: { notice: I18n.t("companies.create.success"), company: }
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
        :name, :business_phone, :country, :timezone, :base_currency,
        :standard_price, :fiscal_year_end, :date_format, :logo,
        address_attributes: [:id, :address_line_1, :address_line_2, :city, :state, :country, :pin])
    end
end
