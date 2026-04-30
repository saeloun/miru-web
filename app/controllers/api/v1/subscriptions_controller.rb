# frozen_string_literal: true

class Api::V1::SubscriptionsController < Api::V1::ApplicationController
  def show
    authorize current_company, policy_class: CompanyPolicy

    render_summary
  end

  def checkout
    authorize current_company, policy_class: CompanyPolicy

    plan_page_url = checkout_plan_page_url
    if plan_page_url.present?
      render json: checkout_payload(plan_page_url), status: 200
      return
    end

    price_id = checkout_price_id
    if price_id.blank?
      render json: { errors: I18n.t("subscriptions.pricing_not_configured") }, status: 422
      return
    end

    customer_id = ensure_stripe_customer_id
    session = Stripe::Checkout::Session.create(
      mode: "subscription",
      customer: customer_id,
      line_items: [{ price: price_id, quantity: checkout_seat_quantity }],
      success_url: "#{request.base_url}/settings/billing?billing=success",
      cancel_url: "#{request.base_url}/settings/billing?billing=cancelled",
      metadata: {
        company_id: current_company.id,
        billing_interval: billing_interval,
        seat_quantity: checkout_seat_quantity
      }
    )

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
        team_member_limit_reached: current_company.team_member_limit_reached?,
        trial_active: current_company.trial_active?,
        trial_available: current_company.trial_available?,
        trial_started_at: current_company.trial_started_at,
        trial_ends_at: current_company.trial_ends_at,
        pro_access: current_company.pro_access?
      }
    end

    def checkout_plan_page_url
      url = ENV["STRIPE_PLAN_PAGE_URL"].to_s
      return if url.blank?

      uri = URI.parse(url)
      params = Rack::Utils.parse_nested_query(uri.query)
      params["prefilled_email"] ||= current_user.email
      params["client_reference_id"] ||= current_company.id.to_s
      params["billing_interval"] ||= billing_interval
      params["quantity"] ||= checkout_seat_quantity.to_s
      uri.query = params.to_query
      uri.to_s
    rescue URI::InvalidURIError
      url
    end

    def checkout_payload(url)
      {
        url:,
        agent_payment_options: {
          stripe_link_cli: Subscriptions::StripeLinkCliPaymentOption.new(
            company: current_company,
            user: current_user,
            interval: billing_interval,
            quantity: checkout_seat_quantity,
            checkout_url: url,
            base_url: request.base_url
          ).payload
        }
      }
    end

    def billing_interval
      value = params[:interval].to_s
      %w[monthly yearly].include?(value) ? value : "monthly"
    end

    def checkout_price_id
      interval_key =
        if billing_interval == "yearly"
          "STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY"
        else
          "STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY"
        end

      ENV[interval_key].presence || ENV["STRIPE_SUBSCRIPTION_PRICE_ID"].to_s
    end

    def ensure_stripe_customer_id
      return current_company.stripe_customer_id if current_company.stripe_customer_id.present?

      customer = Stripe::Customer.create(
        name: current_company.name,
        email: current_user.email,
        metadata: { company_id: current_company.id }
      )
      current_company.update!(stripe_customer_id: customer.id)
      customer.id
    end

    def checkout_seat_quantity
      @checkout_seat_quantity ||= current_company.billable_team_seats
    end
end
