# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    namespace :users do
      devise_scope :user do
        post "login", to: "sessions#create", as: "login"
        delete "logout", to: "sessions#destroy", as: "logout"
        post "signup", to: "registrations#create", as: "signup"
        post "forgot_password", to: "passwords#create", as: "forgot_password"
        put "reset_password", to: "passwords#update", as: "reset_password"
        post "resend_confirmation_email", to: "confirmations#create", as: "resend_confirmation_email"
      end
    end

    resources :clients, only: [:index, :update, :destroy, :show, :create]

    resources :project, only: [:index]
    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
    resources :projects, only: [:index, :show, :create, :update, :destroy] do
      collection do
        get "search", to: "projects/search#index"
      end
    end
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]

    namespace :reports do
      resources :client_revenues, only: [:index, :new]
      resources :time_entries, only: [:index] do
        collection do
          get :download
        end
      end
      resources :outstanding_overdue_invoices, only: [:index]
      resources :accounts_aging, only: [:index]
    end

    resources :workspaces, only: [:index, :update]
    namespace :invoices do
      resources :bulk_deletion, only: [:create]
      resources :bulk_download, only: [:index]
      resources :waived, only: [:update]
      get "(:id)/view", to: "view#show", as: "view"
      get "/:id/payments/success", to: "payments#success", as: "success"
    end

    resources :invoices, only: [:index, :create, :update, :show, :destroy, :edit] do
      member do
        post :send_invoice
        get :download
      end
    end

    resources :generate_invoice, only: [:index, :show]
    resources :project_members, only: [:update]
    resources :employments, only: [:index]
    resources :timezones, only: [:index]

    concern :addressable do
      resources :addresses, only: %i[index create show update]
    end

    resources :companies, only: [:index, :create, :update], concerns: :addressable do
      resource :purge_logo, only: [:destroy], controller: "companies/purge_logo"
    end

    namespace :profiles do
      resources :bank_account_details, only: [:index, :create, :update], param: :account_id
    end

    namespace :wise do
      resources :recipients, only: [:create, :show, :update], param: :recipient_id
      resources :currencies, only: [:index]

      get :fetch_bank_requirements
      get :validate_account_details
    end

    resources :team, only: [:index, :destroy, :update] do
      resource :details, only: [:show, :update], controller: "team_members/details"
      resource :avatar, only: [:update, :destroy], controller: "team_members/avatar"
    end

    resources :invitations, only: [:create, :update, :destroy]

    resources :time_tracking, only: [:index], path: "time-tracking"

    # Non-Resourceful Routes
    get "payments/settings", to: "payment_settings#index"
    post "payments/settings/stripe/connect", to: "payment_settings#connect_stripe"

    resources :payments, only: [:new, :create, :index]

    namespace :payments do
      resources :providers, only: [:index, :update]
    end

    resources :team, only: [:index, :destroy] do
      resource :details, only: [:show, :update], controller: "team_members/details"
    end

    resources :users, concerns: :addressable do
      resources :previous_employments, only: [:create, :index, :show, :update], controller: "users/previous_employments"
      resources :devices, only: [:create, :index, :show, :update], controller: "users/devices"
    end

    resource :profile, only: [:update, :show], controller: "profile" do
      delete "/remove_avatar", to: "profile#remove_avatar"
    end

    resources :vendors, only: [:create]
    resources :expense_categories, only: [:create]
    resources :expenses, only: [:create, :index, :show]
  end
end
