# frozen_string_literal: true

class ActionDispatch::Routing::Mapper
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end
end

Rails.application.routes.draw do
  # Test login route (remove in production)
  get "test_login", to: "test_login#login" if Rails.env.development?

  # Health check endpoint
  get "/health", to: "health#index"

  if ENV["MISSION_CONTROL_ENABLED"] == "true"
    mount MissionControl::Jobs::Engine, at: "/jobs"
  end

  # Mount PgHero for database monitoring (protect with authentication in production)
  authenticate :user, lambda { |u| u.has_role?(:owner, u.current_workspace) } do
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
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web"
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end

  draw(:api)

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
    
    # Postmark bounce and spam complaint handling
    post "postmark/bounces", to: "postmark#bounces"
    post "postmark/spam", to: "postmark#spam_complaints"
  end

  root "home#index"

  match "*path", via: :all, to: "home#index", constraints: lambda { |req|
    req.path.exclude?("rails/active_storage") &&
    !req.path.include?("internal_api") &&
    !req.path.include?("packs/") &&
    !req.path.include?("assets/")
  }
end
