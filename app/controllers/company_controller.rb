# frozen_string_literal: true

class CompanyController < ApplicationController
  def new
  end

  def create
    User
  end

  private
    def company_params
      params.permit(:company, :address, :business_phone, :base_currency, :standard_price, :fiscal_year_end, :date)
    end
end
