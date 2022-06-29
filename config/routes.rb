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
    invitations: "users/invitations",
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

  resources :time_tracking, only: [:index], path: "time-tracking"
  resources :room_scheduling, only: [:index], path: "room-scheduling"

  resources :team, only: [:index, :update, :destroy, :edit]

  resources :reports, only: [:index]
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

  get "clients/*path", to: "clients#index", via: :all
  get "clients", to: "clients#index"

  get "leads/*path", to: "leads#index", via: :all
  get "leads", to: "leads#index"

  get "recruitments/*path", to: "recruitments#index", via: :all
  get "recruitments", to: "recruitments#index"

  get "invoices/*path", to: "invoices#index", via: :all
  get "invoices", to: "invoices#index"

  get "projects/*path", to: "projects#index", via: :all
  get "projects", to: "projects#index"

  get "payments/settings/stripe/connect/refresh", to: "payment_settings#refresh_stripe_connect"
  get "payments/settings/*path", to: "payment_settings#index", via: :all
  get "payments/settings", to: "payment_settings#index"

  get "payments/*path", to: "payments#index", via: :all
  get "payments", to: "payments#index"

  get "subscriptions/*path", to: "subscriptions#index", via: :all
  resources :subscriptions, only: [:index]

  resource :email_confirmation, only: :show do
    get :resend
  end

  devise_scope :user do
    get "profile", to: "users/registrations#edit"
    get "profile/edit", to: "users/registrations#edit"
    delete "profile/purge_avatar", to: "users/registrations#purge_avatar"
    get "profile/edit/*path", to: "users/registrations#edit"
  end
end
