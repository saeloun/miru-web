# frozen_string_literal: true

class InternalApi::V1::Payments::ProvidersController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    current_company.payments_providers.create!(provider_params)
  end

  def index
  end

  def update
  end

  private

    def provider_params
      params.require(:provider).permit(:name)
    end
end
