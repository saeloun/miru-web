# frozen_string_literal: true

class Api::V1::CompaniesController < Api::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token, only: :create

  def index
    authorize current_company

    render :index, locals: {
      current_company:,
      client_list: current_company.clients.kept,
      address: current_company.current_address
    }, status: 200
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
      render json: { notice: I18n.t("companies.update.success"), company: current_company }
    end
  end

  private

    def company_params
      params.require(:company).permit(
        :name, :address, :business_phone, :country, :timezone, :base_currency,
        :standard_price, :fiscal_year_end, :date_format, :logo, :working_hours, :working_days,
        :bank_name, :bank_account_number, :bank_routing_number, :bank_swift_code,
        :tax_id, :vat_number, :gst_number,
        addresses_attributes: [:id, :address_line_1, :address_line_2, :city, :state, :country, :pin]
      )
    end
end
