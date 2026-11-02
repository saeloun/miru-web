# frozen_string_literal: true

class RazorpayConnectionsController < ApplicationController
  prepend_before_action :prevent_caching
  # Preserve the callback's referrer policy when an expired session needs sign-in.
  skip_before_action :authenticate_user!, only: :callback
  skip_before_action :track_ahoy_visit, only: :callback
  before_action :authenticate_callback, only: :callback
  before_action :authorize_management
  rate_limit to: 10, within: 1.minute, only: :create, by: -> { current_user.id }

  def show
    available = begin
      PaymentProviders::RazorpayOauthClient.new
      true
    rescue PaymentProviders::RazorpayOauthClient::Unavailable
      false
    end
    render json: { connection: connection.status, connect_available: available }
  end

  def create
    client = PaymentProviders::RazorpayOauthClient.new
    state = current_company.with_lock("FOR NO KEY UPDATE") do
      authorize_management
      provider.save! if provider.new_record?
      connection(client:).start!
    end
    session[:razorpay_oauth] = { "state" => state, "company_id" => current_company.id, "user_id" => current_user.id }
    render json: { url: client.authorization_url(state:) }
  rescue PaymentProviders::RazorpayOauthClient::Unavailable => error
    render json: { errors: error.message }, status: 503
  rescue PaymentProviders::RazorpayOauthConnection::Error => error
    render json: { errors: error.message }, status: 409
  end

  def callback
    browser = session[:razorpay_oauth]
    unless browser.is_a?(Hash) && browser["company_id"] == current_company.id && browser["user_id"] == current_user.id &&
        params[:state].is_a?(String) && browser["state"].is_a?(String) &&
        ActiveSupport::SecurityUtils.secure_compare(browser["state"], params[:state])
      return redirect_to "/payments/settings?razorpay=failed"
    end
    session.delete(:razorpay_oauth)
    result = connection.complete!(state: params[:state], browser_state: browser["state"], code: params[:code], error: params[:error])
    redirect_to "/payments/settings?razorpay=#{result}"
  rescue PaymentProviders::RazorpayOauthConnection::Error, PaymentProviders::RazorpayOauthClient::Error
    redirect_to "/payments/settings?razorpay=failed"
  end

  def destroy
    result = connection.disconnect!
    session.delete(:razorpay_oauth)
    render json: { connection: connection.status, remote_revocation_confirmed: result.fetch(:remote_revocation_confirmed) }
  rescue PaymentProviders::RazorpayOauthConnection::Error => error
    render json: { errors: error.message }, status: 409
  end

  private

    def authenticate_callback
      redirect_to new_user_session_path unless user_signed_in?
    end

    def authorize_management
      authorize current_company, :manage?, policy_class: RazorpayConnectionPolicy
    end

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Referrer-Policy"] = "no-referrer"
    end

    def provider
      @provider ||= current_company.payments_providers.find_or_initialize_by(name: PaymentsProvider::RAZORPAY_PROVIDER) do |record|
        record.settings = { "platform_fee_percent" => "0", "route_transfers_enabled" => false, "payouts_enabled" => false }
      end
    end

    def connection(client: nil)
      PaymentProviders::RazorpayOauthConnection.new(provider:, actor: current_user, client:)
    end
end
