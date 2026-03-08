# frozen_string_literal: true

class Api::V1::SubscriptionsController < Api::V1::ApplicationController
  def show
    authorize current_company, policy_class: CompanyPolicy

    render json: {
      plan_tier: current_company.plan_tier,
      billing_exempt: current_company.billing_exempt,
      subscription_status: current_company.subscription_status,
      subscription_ends_at: current_company.subscription_ends_at,
      has_stripe_customer: current_company.stripe_customer_id.present?,
      team_member_limit: current_company.team_member_limit,
      used_team_seats: current_company.used_team_seats,
      team_member_limit_reached: current_company.team_member_limit_reached?
    }, status: 200
  end

  def checkout
    authorize current_company, policy_class: CompanyPolicy

    plan_page_url = checkout_plan_page_url
    if plan_page_url.present?
      render json: { url: plan_page_url }, status: 200
      return
    end

    price_id = ENV["STRIPE_SUBSCRIPTION_PRICE_ID"].to_s
    if price_id.blank?
      render json: { errors: "STRIPE_SUBSCRIPTION_PRICE_ID is not configured" }, status: 422
      return
    end

    customer_id = ensure_stripe_customer_id
    session = Stripe::Checkout::Session.create(
      mode: "subscription",
      customer: customer_id,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: "#{request.base_url}/settings/preferences?billing=success",
      cancel_url: "#{request.base_url}/settings/preferences?billing=cancelled",
      metadata: { company_id: current_company.id }
    )

    render json: { url: session.url }, status: 200
  rescue Stripe::StripeError => e
    render json: { errors: e.message }, status: 422
  end

  def portal
    authorize current_company, policy_class: CompanyPolicy

    if current_company.stripe_customer_id.blank?
      render json: { errors: "No billing customer exists for this company" }, status: 422
      return
    end

    session = Stripe::BillingPortal::Session.create(
      customer: current_company.stripe_customer_id,
      return_url: "#{request.base_url}/settings/preferences"
    )

    render json: { url: session.url }, status: 200
  rescue Stripe::StripeError => e
    render json: { errors: e.message }, status: 422
  end

  private

    def checkout_plan_page_url
      url = ENV["STRIPE_PLAN_PAGE_URL"].to_s
      return if url.blank?

      uri = URI.parse(url)
      params = Rack::Utils.parse_nested_query(uri.query)
      params["prefilled_email"] ||= current_user.email
      params["client_reference_id"] ||= current_company.id.to_s
      uri.query = params.to_query
      uri.to_s
    rescue URI::InvalidURIError
      url
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
end
