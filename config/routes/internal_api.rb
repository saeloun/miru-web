# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy, :show, :create] do
      get "new_invoice_line_items", to: "clients/new_invoice_line_items", on: :member
    end
    resources :leads, only: [:index, :update, :destroy, :show, :create] do
      get "items", to: "/lead_items", on: :collection
      get "actions", to: "/lead_actions", on: :collection
      get "allowed_users", to: "/lead_allowed_users", on: :collection
      resources :line_items, only: [:index, :update, :destroy, :show, :create], module: :leads
      resources :quotes, only: [:index, :update, :destroy, :show, :create, :edit], module: :leads
      resources :timelines, only: [:index, :update, :destroy, :show, :create, :edit], module: :leads
      get "timeline_items", to: "/lead_timeline_items", on: :collection
    end
    namespace :recruitments do
      resources :consultancies, only: [:index, :update, :destroy, :show, :create]
      resources :candidates, only: [:index, :update, :destroy, :show, :create, :edit]
    end
    resources :space_usages, only: [:index, :create, :update, :destroy]

    resources :project, only: [:index]
    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
    resources :projects, only: [:index, :show, :create, :update, :destroy]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]

    namespace :reports do
      resources :time_entries, only: [:index] do
        collection do
          get :download
        end
      end

      resources :client_revenues, only: [:index]
      resources :outstanding_overdue_invoices, only: [:index]
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
    resources :employments, only: [:index]
    resources :timezones, only: [:index]

    resources :companies, only: [:index, :create, :update] do
      resource :purge_logo, only: [:destroy], controller: "companies/purge_logo"
    end

    namespace :profiles do
      resources :bank_account_details, only: [:index, :create, :update], param: :account_id
      resources :team_members, only: [:index] do
        patch :update, on: :collection
      end
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
    resources :engagements, only: [:index, :update] do
      get "items", to: "/engagements_items", on: :collection
    end

    resources :devices, only: [:index, :update, :destroy] do
      get "items", to: "/devices_items", on: :collection

      resources :device_usages, module: :devices do
        get :demand, on: :collection
        get :demand_cancel, on: :collection
        put :approve, on: :collection
      end
    end

    resource :profile, only: [:update, :show], controller: "profile" do
      delete "/remove_avatar", to: "profile#remove_avatar"
    end
  end
end
