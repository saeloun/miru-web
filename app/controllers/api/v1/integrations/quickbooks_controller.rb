# frozen_string_literal: true

class Api::V1::Integrations::QuickbooksController < Api::V1::ApplicationController
  OAUTH_STATE_SESSION_KEY = :quickbooks_oauth_state
  OAUTH_COMPANY_SESSION_KEY = :quickbooks_oauth_company_id

  def status
    authorize :quickbooks_integration, policy_class: QuickbooksIntegrationPolicy
    render json: quickbooks_payload
  end

  def connect
    authorize :quickbooks_integration, policy_class: QuickbooksIntegrationPolicy
    unless QuickBooks::Configuration.configured?
      render json: { errors: "QuickBooks OAuth credentials are not configured" }, status: 422
      return
    end

    state = SecureRandom.hex(24)
    session[OAUTH_STATE_SESSION_KEY] = state
    session[OAUTH_COMPANY_SESSION_KEY] = current_company.id

    render json: {
      authorizationUrl: QuickBooks::OauthClient.new.authorization_uri(state:)
    }
  end

  def callback
    authorize :quickbooks_integration, policy_class: QuickbooksIntegrationPolicy
    if oauth_callback_invalid?
      redirect_to quickbooks_settings_path(result: "error")
      return
    end

    token_response = QuickBooks::OauthClient.new.exchange_code!(params[:code].to_s)
    connection = upsert_connection!(token_response)
    capture_company_name(connection)
    clear_oauth_session

    redirect_to quickbooks_settings_path(result: "connected")
  rescue QuickBooks::Error, ActiveRecord::RecordInvalid => e
    Rails.logger.warn("QuickBooks OAuth callback failed: #{e.class}: #{e.message}")
    redirect_to quickbooks_settings_path(result: "error")
  end

  def disconnect
    authorize :quickbooks_integration, policy_class: QuickbooksIntegrationPolicy
    active_connection&.disconnect!
    render json: quickbooks_payload
  end

  def settings
    authorize :quickbooks_integration, policy_class: QuickbooksIntegrationPolicy
    connection = active_connection
    unless connection
      render json: { errors: "Connect QuickBooks before saving settings" }, status: 404
      return
    end

    connection.update!(settings: connection.settings.merge(settings_params.to_h.compact_blank))
    render json: quickbooks_payload(connection)
  end

  private

    def upsert_connection!(token_response)
      connection = current_company.quickbooks_connections.active.find_or_initialize_by(
        environment: QuickBooks::Configuration.environment
      )

      connection.assign_attributes(
        realm_id: params[:realmId],
        status: :connected,
        access_token: token_response.fetch("access_token"),
        refresh_token: token_response.fetch("refresh_token"),
        access_token_expires_at: expires_at(token_response["expires_in"]),
        refresh_token_expires_at: expires_at(token_response["x_refresh_token_expires_in"]),
        disconnected_at: nil
      )
      connection.save!
      connection
    end

    def capture_company_name(connection)
      response = QuickBooks::Client.new(connection:).company_info
      company_name = response.dig("CompanyInfo", "CompanyName")
      return if company_name.blank?

      connection.update!(settings: connection.settings.merge("company_name" => company_name))
    rescue QuickBooks::Error => e
      Rails.logger.info("QuickBooks company info fetch failed: #{e.message}")
    end

    def active_connection
      @_active_connection ||= current_company.quickbooks_connections.active.find_by(
        environment: QuickBooks::Configuration.environment
      )
    end

    def quickbooks_payload(connection = active_connection)
      {
        quickbooks: {
          configured: QuickBooks::Configuration.configured?,
          connected: connection&.connected? || false,
          status: connection&.status,
          environment: QuickBooks::Configuration.environment,
          realmId: connection&.realm_id,
          companyName: connection&.company_name,
          lastSuccessfulSyncAt: connection&.last_successful_sync_at&.iso8601,
          reconnectRequired: connection&.reconnect_required? || false,
          mappingSettings: {
            incomeAccountId: connection&.income_account_id,
            accountsReceivableAccountId: connection&.accounts_receivable_account_id,
            depositAccountId: connection&.deposit_account_id,
            serviceItemId: connection&.service_item_id,
            taxCodeId: connection&.tax_code_id
          }
        }
      }
    end

    def oauth_callback_invalid?
      params[:error].present? ||
        params[:code].blank? ||
        params[:realmId].blank? ||
        params[:state].blank? ||
        params[:state] != session[OAUTH_STATE_SESSION_KEY] ||
        session[OAUTH_COMPANY_SESSION_KEY].to_i != current_company.id
    end

    def clear_oauth_session
      session.delete(OAUTH_STATE_SESSION_KEY)
      session.delete(OAUTH_COMPANY_SESSION_KEY)
    end

    def quickbooks_settings_path(result:)
      "/settings/payment?quickbooks=#{result}"
    end

    def expires_at(seconds)
      return nil if seconds.blank?
      seconds.to_i.seconds.from_now
    end

    def settings_params
      params.require(:quickbooks).permit(
        :income_account_id,
        :accounts_receivable_account_id,
        :deposit_account_id,
        :service_item_id,
        :tax_code_id
      )
    end
end
