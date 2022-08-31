# frozen_string_literal: true

require "sidekiq/web"

class ActionDispatch::Routing::Mapper
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end
end

Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions",
    passwords: "users/passwords",
    omniauth_callbacks: "users/omniauth_callbacks"
  }

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  # For opening the email in the web browser in non production environments
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web"
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end

  Sidekiq::Web.use Rack::Auth::Basic do |username, password|
    ActiveSupport::SecurityUtils.secure_compare(
      ::Digest::SHA256.hexdigest(username),
      ::Digest::SHA256.hexdigest(ENV["SIDEKIQ_USERNAME"])) &
      ActiveSupport::SecurityUtils.secure_compare(
        ::Digest::SHA256.hexdigest(password),
        ::Digest::SHA256.hexdigest(ENV["SIDEKIQ_PASSWORD"]))
  end
  mount Sidekiq::Web, at: "/sidekiq"

  root to: "root#index"
  draw(:internal_api)
  resources :dashboard, only: [:index]

  # get "*path", to: "home#index", via: :all
  resource :company, only: [:new, :show, :create, :update], controller: :companies do
    resource :purge_logo, only: [:destroy], controller: "companies/purge_logo"
  end

  resources :workspaces, only: [:update]

  resources :invoices, only: [], module: :invoices do
    resources :payments, only: [:new] do
      collection do
        get :success
        get :cancel
      end
    end

    member do
      get :view, to: "view#show", as: :view
    end
  end

  namespace :invitations do
    resources :accepts, only: [:index], controller: "accept"
  end

  get "users/invitation/accept", to: "invitations/accept#show"

  get "payments/settings/stripe/connect/refresh", to: "payment_settings#refresh_stripe_connect"
  get "payments/settings/*path", to: "payment_settings#index", via: :all
  get "payments/settings", to: "payment_settings#index"

  resource :email_confirmation, only: :show do
    get :resend
  end

  devise_scope :user do
    # TODO: verify if this is path is in use otherwise remove it.
    delete "profile/purge_avatar", to: "users/registrations#purge_avatar"
  end

  match "*path", via: :all, to: "home#index", constraints: lambda { |req|
    req.path.exclude? "rails/active_storage"
  }
end
