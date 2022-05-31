# frozen_string_literal: true

class InternalApi::V1::Companies::PurgeLogoController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:destroy]

  def destroy
    current_company.logo.destroy
    render json: { notice: I18n.t("companies.purge_logo.destroy.success") }, status: :ok
  end
end
