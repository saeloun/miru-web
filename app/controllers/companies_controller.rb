# frozen_string_literal: true

class CompaniesController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def logo
    company = Company.find_by(id: params[:id])

    if company&.logo&.attached?
      redirect_to rails_blob_url(company.logo, disposition: "inline"), allow_other_host: true, status: 301
    else
      head 404
    end
  end
end
