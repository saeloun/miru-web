# frozen_string_literal: true

namespace :api, defaults: { format: "json" } do
  namespace :v1 do
    namespace :users do
      devise_scope :user do
        post "login", to: "sessions#create", as: "login"
        delete "logout", to: "sessions#destroy", as: "logout"
        get "_me", to: "sessions#me", as: "me"
        post "signup", to: "registrations#create", as: "signup"
        post "forgot_password", to: "passwords#create", as: "forgot_password"
        put "reset_password", to: "passwords#update", as: "reset_password"
        post "resend_confirmation_email", to: "confirmations#create", as: "resend_confirmation_email"
      end
    end

    resources :clients, only: [:index, :update, :destroy, :show, :create] do
      collection do
        get "invoices", to: "clients/invoices#index"
        get "invoices/:id", to: "clients/invoices#show", as: "invoice"
      end

      resources :client_members, only: [:index, :update, :destroy]

      member do
        post :send_payment_reminder
      end
      member do
        post :add_client_contact
      end
    end

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
      resources :client_revenues, only: [:index, :new] do
        collection do
          get :download
        end
      end
      resources :time_entries, only: [:index] do
        collection do
          get :download
        end
      end
      resources :outstanding_overdue_invoices, only: [:index] do
        collection do
          get :download
        end
      end
      resources :accounts_aging, only: [:index] do
        collection do
          get :download
        end
      end
      resources :payments, only: [:index] do
        collection do
          get :download
        end
      end
    end

    resources :workspaces, only: [:index, :update]
    namespace :invoices do
      resources :bulk_deletion, only: [:create]
      resources :bulk_download, only: [:index] do
        get :status, on: :collection
      end
      resources :action_trails, only: [:show]
      resources :waived, only: [:update]
      resources :analytics, only: [] do
        collection do
          get :monthly_revenue
          get :revenue_by_status
        end
      end
      resources :recently_updated, only: [:index]
      get "(:id)/view", to: "view#show", as: "view"
      get "/:id/payments/success", to: "payments#success", as: "success"
    end

    resources :invoices, only: [:index, :create, :update, :show, :destroy, :edit] do
      member do
        post :send_invoice
        post :send_reminder
        get :download
      end
    end

    resources :generate_invoice, only: [:index, :show]
    resources :project_members, only: [:update]
    resources :employments, only: [:index, :show, :update]
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
      collection { put "update_team_members" }
      resource :notification_preferences, only: [:show, :update], controller: "team_members/notification_preferences"
    end

    resources :invitations, only: [:create, :update, :destroy] do
      member do
        post "resend"
      end
    end

    resources :time_tracking, only: [:index], path: "time-tracking"

    # Non-Resourceful Routes
    get "payments/settings", to: "payment_settings#index"
    post "payments/settings/stripe/connect", to: "payment_settings#connect_stripe"
    delete "payments/settings/stripe/disconnect", to: "payment_settings#destroy"
    get "calendars/redirect", to: "calendars#redirect", as: "redirect"
    get "calendars/callback", to: "calendars#callback", as: "callback"
    get "calendars/calendars", to: "calendars#calendars", as: "calendars"
    get "calendars/events/:calendar_id", to: "calendars#events", as: "events", calendar_id: /[^\/]+/

    resources :payments, only: [:new, :create, :index]
    resources :holidays, only: [:update, :index], param: :year

    namespace :payments do
      resources :providers, only: [:index, :update]
    end

    resources :users, concerns: :addressable do
      resources :previous_employments, only: [:create, :index, :show, :update], controller: "users/previous_employments"
      resources :devices, only: [:create, :index, :show, :update], controller: "users/devices"
    end

    resource :profile, only: [:update], controller: "profile"

    resources :vendors, only: [:create]
    resources :expense_categories, only: [:create]
    resources :expenses, only: [:create, :index, :show, :update, :destroy]
    resources :bulk_previous_employments, only: [:update]

    resources :leaves, as: "leave" do
      resources :leave_types
    end

    resources :timeoff_entries, except: [:new, :edit]

    patch "leave_with_leave_type/:year", to: "leave_with_leave_types#update", as: :update_leave_with_leave_types
    patch "custom_leaves/:year", to: "custom_leaves#update"
    match "*path", to: "application#not_found", via: :all, constraints: lambda { |req|
      req.path.exclude?("rails/active_storage") && req.path.include?("api")
    }
  end
end
