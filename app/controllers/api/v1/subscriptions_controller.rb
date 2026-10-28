# frozen_string_literal: true

class Api::V1::SubscriptionsController < Api::V1::ApplicationController
  def show
    authorize current_company, policy_class: CompanyPolicy

    if current_company.plan_tier != "paid" && current_company.stripe_customer_id.present?
      Subscriptions::StripeSyncService.reconcile(company: current_company)
    end
    render_summary
  end

  def checkout
    authorize current_company, policy_class: CompanyPolicy

    if current_company.billing_exempt? || current_company.plan_tier == "paid"
      render json: { errors: I18n.t("subscriptions.already_subscribed") }, status: 422
      return
    end

    price_id = checkout_price_id
    if price_id.blank?
      render json: { errors: I18n.t("subscriptions.pricing_not_configured") }, status: 422
      return
    end

    session = Subscriptions::CheckoutService.new(
      company: current_company, user: current_user, price_id:, interval: billing_interval,
      base_url: request.base_url
    ).process
    unless session
      render json: { errors: I18n.t("subscriptions.already_subscribed") }, status: 422
      return
    end

    track_checkout_started("stripe_checkout")
    render json: checkout_payload(session.url), status: 200
  rescue Stripe::StripeError => e
    render json: { errors: e.message }, status: 422
  end

  def portal
    authorize current_company, policy_class: CompanyPolicy

    if current_company.stripe_customer_id.blank?
      render json: { errors: I18n.t("subscriptions.no_billing_customer") }, status: 422
      return
    end

    session = Stripe::BillingPortal::Session.create(
      customer: current_company.stripe_customer_id,
      return_url: "#{request.base_url}/settings/billing"
    )

    render json: { url: session.url }, status: 200
  rescue Stripe::StripeError => e
    render json: { errors: e.message }, status: 422
  end

  def trial
    authorize current_company, policy_class: CompanyPolicy

    current_company.start_pro_trial!
    Analytics::TrackingService.new(user: current_user).track_trial_started(current_company, source: "billing")
    SubscriptionMailer.with(company_id: current_company.id, recipient_id: current_user.id).trial_started.deliver_later

    render_summary(notice: I18n.t("subscriptions.trial_started"))
  rescue ArgumentError
    render json: { errors: I18n.t("subscriptions.trial_not_eligible") }, status: 422
  end

  private

    def render_summary(notice: nil)
      render json: summary_payload.merge(notice:).compact, status: 200
    end

    def summary_payload
      {
        plan_tier: current_company.plan_tier,
        plan_label: current_company.current_plan_label,
        billing_exempt: current_company.billing_exempt,
        subscription_status: current_company.current_subscription_status,
        subscription_ends_at: current_company.subscription_ends_at,
        cancel_at_period_end: current_company.cancel_at_period_end,
        subscription_interval: current_company.try(:subscription_interval),
        has_stripe_customer: current_company.stripe_customer_id.present?,
        team_member_limit: current_company.team_member_limit,
        used_team_seats: current_company.used_team_seats,
        billable_team_seats: current_company.billable_team_seats,
        client_portal_users_count: current_company.client_portal_users_count,
        team_member_limit_reached: current_company.team_member_limit_reached?,
        trial_active: current_company.trial_active?,
        trial_available: current_company.trial_available?,
        trial_started_at: current_company.trial_started_at,
        trial_ends_at: current_company.trial_ends_at,
        pro_access: current_company.pro_access?
      }
    end

    def checkout_payload(url)
      {
        url:,
        agent_payment_options: {
          stripe_link_cli: Subscriptions::StripeLinkCliPaymentOption.new({
            company: current_company,
            user: current_user,
            interval: billing_interval,
            quantity: checkout_seat_quantity,
            checkout_url: url,
            base_url: request.base_url
          }).payload
        }
      }
    end

    def billing_interval
      value = params[:interval].to_s
      %w[monthly yearly].include?(value) ? value : "monthly"
    end

    def checkout_price_id
      candidates =
        if billing_interval == "yearly"
          %w[STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY STRIPE_YEARLY_PRICE_ID]
        else
          %w[STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY STRIPE_MONTHLY_PRICE_ID]
        end
      candidates << "STRIPE_SUBSCRIPTION_PRICE_ID"

      candidates.filter_map { |name| ENV[name].presence }.first.to_s
    end

    def checkout_seat_quantity
      @checkout_seat_quantity ||= current_company.billable_team_seats
    end

    def track_checkout_started(provider)
      Analytics::TrackingService.new(user: current_user).track_subscription_checkout_started(
        current_company,
        interval: billing_interval,
        seat_quantity: checkout_seat_quantity,
        provider:
      )
    end
end
