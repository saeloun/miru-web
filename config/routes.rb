# frozen_string_literal: true

class ActionDispatch::Routing::Mapper
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end
end

Rails.application.routes.draw do
  if Rails.env.development? || Rails.env.test?
    mount MissionControl::Jobs::Engine, at: "/jobs"
  end

  namespace :admin do
      resources :users
      resources :timesheet_entries
      resources :stripe_connected_accounts
      resources :roles
      resources :project_members
      resources :projects
      resources :payments
      resources :invoice_line_items
      resources :invoices
      resources :invitations
      resources :companies
      resources :clients
      resources :addresses

      root to: "users#index"
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

  draw(:internal_api)
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
  end

  root "home#index"

  match "*path", via: :all, to: "home#index", constraints: lambda { |req|
    req.path.exclude?("rails/active_storage") && !req.path.include?("internal_api")
  }
end
