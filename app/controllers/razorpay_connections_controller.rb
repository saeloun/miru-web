# frozen_string_literal: true

class RazorpayConnectionsController < ApplicationController
  prepend_before_action :prevent_caching
  # Preserve the callback's referrer policy when an expired session needs sign-in.
  skip_before_action :authenticate_user!, only: :callback
  skip_before_action :track_ahoy_visit, only: :callback
  before_action :authenticate_callback, only: :callback
  before_action :authorize_management
  rate_limit to: 10, within: 1.minute, name: "mutation", by: -> { current_user.id },
    only: %i[create update destroy recovery recovery_evidence resolve_payment_review recover_link_creation]
  rate_limit to: 20, within: 1.minute, name: "callback", by: -> { current_user.id }, only: :callback,
    with: -> { redirect_to "/settings/payment?razorpay=failed" }

  rescue_from PaymentProviders::RazorpayOauthConnection::Error, with: :render_conflict

  def show
    unavailable_reason = connect_unavailable_reason
    render json: {
      connection: connection.status, connect_available: unavailable_reason.nil?, unavailable_reason:,
      api_keys_blocked: provider.razorpay_oauth_in_use?
    }
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
  end

  def update
    connection.update_collections!(enabled: ActiveModel::Type::Boolean.new.cast(params[:enabled]) == true)
    render_connection
  end

  def callback
    browser = session[:razorpay_oauth]
    unless browser.is_a?(Hash) && browser["company_id"] == current_company.id && browser["user_id"] == current_user.id &&
        params[:state].is_a?(String) && browser["state"].is_a?(String) &&
        ActiveSupport::SecurityUtils.secure_compare(browser["state"], params[:state])
      return redirect_to "/settings/payment?razorpay=failed"
    end
    session.delete(:razorpay_oauth)
    result = connection.complete!(state: params[:state], browser_state: browser["state"], code: params[:code], error: params[:error])
    redirect_to "/settings/payment?razorpay=#{result}"
  rescue PaymentProviders::RazorpayOauthConnection::Error, PaymentProviders::RazorpayOauthClient::Error
    redirect_to "/settings/payment?razorpay=failed"
  end

  def destroy
    result = connection.disconnect!
    session.delete(:razorpay_oauth)
    render json: { connection: connection.status, remote_revocation_confirmed: result.fetch(:remote_revocation_confirmed) }
  end

  def recovery
    connection.request_recovery!(account_id: params[:account_id])
    render_connection
  end

  def recovery_evidence
    connection.finish_recovery_with_evidence!(provider_reference: params[:provider_reference])
    render_connection
  end

  def resolve_payment_review
    PaymentProviders::RazorpayPaymentReview.resolve!(current_company, params[:invoice_id], params[:review_id].to_s, actor: current_user)
    render_connection
  rescue PaymentProviders::RazorpayClient::Error
    render json: { errors: "Review kept. Check that this link is closed in Razorpay and this account is connected to Miru before retrying. No payment was recorded or refunded." }, status: 409
  end

  def recover_link_creation
    invoice = current_company.invoices.find(params[:invoice_id])
    link_id = params[:payment_link_id]
    link_id = link_id.strip if link_id.is_a?(String)
    unless link_id.nil? || (link_id.is_a?(String) && (link_id.empty? || link_id.match?(PaymentProviders::RazorpayPaymentLinkCreation::LINK_ID)))
      return render json: { code: "invalid_link_id", errors: "Enter a Payment Link ID beginning with plink_. Nothing was checked." }, status: 422
    end
    creation = PaymentProviders::RazorpayPaymentLinkCreation.new(invoice:, provider:)
    creation.recover!(payment_link_id: link_id)
    current_user.reload
    authorize_management
    pending = PaymentProviders::RazorpayPaymentLinkCreation.pending?(invoice.reload)
    render json: { connection: connection.status, link_creation_pending: pending,
      link_creation_checked: creation.checked, link_confirmed: !pending && invoice.razorpay_payment_link_id.present? }
  rescue PaymentProviders::RazorpayClient::Error
    render json: { errors: "Link confirmation is still pending. Check its original Razorpay account, mode and reference, then retry." }, status: 409
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

    def render_connection
      render json: { connection: connection.status }
    end

    def render_conflict(error)
      render json: { errors: error.message }, status: 409
    end

    def connect_unavailable_reason
      return "legacy_api_keys" if connection.legacy?

      PaymentProviders::RazorpayOauthClient.new
      nil
    rescue PaymentProviders::RazorpayOauthClient::Unavailable
      "not_configured"
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
