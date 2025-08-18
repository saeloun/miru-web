# frozen_string_literal: true

class Api::V1::CompaniesController < Api::V1::ApplicationController
  include Rails.application.routes.url_helpers

  before_action :authenticate_user!
  before_action :set_company, only: [:show, :update]
  after_action :verify_authorized, except: [:index]

  def index
    @company = current_user.current_workspace || current_user.companies.first

    if @company
      details = company_details(@company)
      details[:address] = serialize_address(@company.current_address)
      render json: {
        company_details: details
      }, status: 200
    else
      render json: { error: "No company found" }, status: 404
    end
  end

  def show
    authorize @company
    render json: { company: company_details(@company) }, status: 200
  end

  def create
    @company = Company.new(company_params)
    @company.users << current_user
    authorize @company

    if @company.save
      current_user.update(current_workspace_id: @company.id)
      render json: { company: company_details(@company), notice: "Company created successfully" }, status: 201
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @company
    if @company.update(company_params)
      render json: { company: company_details(@company), notice: "Company updated successfully" }, status: 200
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

    def set_company
      @company = current_user.current_workspace || current_user.companies.first
    end

    def company_params
      params.require(:company).permit(
        :name, :address, :country, :city, :state, :zipcode,
        :phone_number, :business_phone, :base_currency, :standard_price,
        :fiscal_year_end, :date_format, :timezone, :logo, :working_days, :working_hours,
        addresses_attributes: [:address_line_1, :address_line_2, :city, :state, :country, :pin]
      )
    end

    def company_details(company)
      {
        id: company.id,
        name: company.name,
        logo: company.logo.attached? ? rails_blob_url(company.logo) : nil,
        phone: company.business_phone,
        business_phone: company.business_phone,
        base_currency: company.base_currency,
        standard_price: company.standard_price,
        fiscal_year_end: company.fiscal_year_end,
        date_format: company.date_format,
        timezone: company.timezone
      }
    end

    def serialize_address(address)
      return {} unless address
      {
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        city: address.city,
        state: address.state,
        country: address.country,
        pin: address.pin
      }
    end
end
