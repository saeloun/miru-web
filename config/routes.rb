# frozen_string_literal: true

class ActionDispatch::Routing::Mapper
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end
end

Rails.application.routes.draw do
  # Health check endpoint
  get "/health", to: "health#index"

  if ENV["MISSION_CONTROL_ENABLED"] == "true"
    mount MissionControl::Jobs::Engine, at: "/jobs"
  end

  # Mount PgHero for database monitoring (restricted to super admins)
  authenticate :user, lambda { |u| u.super_admin? } do
    mount PgHero::Engine, at: "/pghero"
  end

  # Analytics Dashboard (Super Admin and authorized users only)
  authenticate :user, lambda { |u| u.has_analytics_access? } do
    resources :analytics, only: [:index] do
      collection do
        get :revenue
        get :activity
        get :currency
      end
    end
  end

  devise_for :users, skip: [:sessions, :registrations], controllers: {
    confirmations: "users/confirmations",
    omniauth_callbacks: "users/omniauth_callbacks"
  }

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  # For opening the email in the web browser in non production environments
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web" && !Rails.env.test? && defined?(LetterOpenerWeb)
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end

  draw(:api)

  match "/mcp", to: "api/v1/mcp#handle", via: [:get, :post, :delete], as: :mcp

  resources :workspaces, only: [:update]

  resources :invoices, only: [], module: :invoices do
    resources :payments, only: [:new] do
      collection do
        get :cancel
      end
    end
  end

  namespace :invitations do
    resources :accepts, only: [:index], controller: "accept"
  end

  get "users/invitation/accept", to: "invitations/accept#show"
  get "payments/settings/stripe/connect/refresh", to: "payment_settings#refresh_stripe_connect"
  get "payments/settings/*path", to: "payment_settings#index", via: :all
  get "payments/settings", to: "payment_settings#index"

  namespace :webhooks do
    post "stripe/checkout/fulfillment", to: "stripe#fulfill_stripe_checkout"
  end

  # Keep docs reachable from the main app domain.
  get "/docs", to: redirect("https://docs.miru.so")
  get "/docs/*path", to: redirect { |params, request|
    suffix = params[:path].to_s
    query = request.query_string.present? ? "?#{request.query_string}" : ""
    suffix.present? ? "https://docs.miru.so/#{suffix}#{query}" : "https://docs.miru.so#{query}"
  }

  get "/openapi.json", to: "agent_readiness#openapi", defaults: { format: :json }
  get "/.well-known/api-catalog", to: "agent_readiness#api_catalog"
  get "/.well-known/mcp/server-card.json", to: "agent_readiness#mcp_server_card", defaults: { format: :json }
  get "/.well-known/agent-skills/index.json", to: "agent_readiness#agent_skills", defaults: { format: :json }

  root "home#index"

  match "*path", via: :all, to: "home#index", constraints: lambda { |req|
    req.path.exclude?("rails/active_storage") &&
    !req.path.start_with?("/api/") &&
    !req.path.include?("packs/") &&
    !req.path.include?("assets/") &&
    !req.path.start_with?("/.well-known")
  }
end
