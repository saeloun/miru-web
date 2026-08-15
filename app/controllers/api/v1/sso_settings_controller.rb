# frozen_string_literal: true

class Api::V1::SsoSettingsController < Api::V1::ApplicationController
  def show
    authorize current_company, policy_class: SsoSettingPolicy

    render json: settings_payload, status: 200
  end

  def update
    authorize current_company, policy_class: SsoSettingPolicy

    current_company.sso_settings_actor = current_user
    current_company.update!(settings_params)

    render json: settings_payload, status: 200
  end

  private

    def settings_params
      params.require(:company).permit(:sso_enforced, allowed_sso_domains: [])
    end

    def settings_payload
      current_company.slice(:sso_enforced, :allowed_sso_domains)
    end
end
