# frozen_string_literal: true

class CompaniesController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def logo
    company = Company.find_by(id: params[:id])

    if company&.logo&.attached?
      redirect_to company_logo_url(company), allow_other_host: true
    else
      head 404
    end
  end

  private

    def company_logo_url(company)
      logo = company.logo

      return rails_blob_url(logo, disposition: "inline") unless logo.blob.variable?

      rails_representation_url(logo.variant(resize_to_fill: [72, 72]), disposition: "inline")
    end
end
