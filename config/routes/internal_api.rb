# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy, :show, :create] do
      get "new_invoice_line_items", to: "clients/new_invoice_line_items", on: :member
    end
    resources :project, only: [:index]
    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
    resources :projects, only: [:index, :show, :create, :update, :destroy]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]

    namespace :reports do
      resources :time_entry, only: [:index] do
        collection do
          get :download
        end
      end
    end

    resources :workspaces, only: [:update]
    resources :invoices, only: [:index, :create, :update, :show, :destroy, :edit] do
      post :send_invoice, on: :member
    end
    namespace :invoices do
      resources :bulk_deletion, only: [:create]
    end
    resources :generate_invoice, only: [:index, :show]
    resources :project_members, only: [:update]
    resources :company_users, only: [:index]
    resources :timezones, only: [:index]

    resources :companies, only: [:index, :create, :update] do
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

    # Non-Resourceful Routes
    get "payments/settings", to: "payment_settings#index"
    post "payments/settings/stripe/connect", to: "payment_settings#connect_stripe"

    namespace :payments do
      resources :providers, only: [:index, :update]
    end

    resources :team, only: [:index, :destroy]

    resource :profile, only: [:update, :show], controller: "profile" do
      delete "/remove_avatar", to: "profile#remove_avatar"
    end
  end
end
