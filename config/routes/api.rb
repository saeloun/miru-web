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

      resources :passkeys, only: [:index, :create, :destroy] do
        collection do
          post :registration_options
          post :authenticate
          patch :requirement, action: :update_requirement
        end
      end

      resource :totp, only: [:show, :destroy], controller: "totp" do
        collection do
          post :setup
          post :confirm
          post :authenticate
          post :recovery_codes, action: :regenerate_recovery_codes
        end
      end
    end

    resource :chatbase_token, only: [:show]

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
    namespace :cli do
      resource :capabilities, only: [:show], controller: "capabilities"
      resource :session, only: [:destroy], controller: "sessions"
      resources :clients, only: [:index]
      resources :expenses, only: [:index, :create]
      resources :timesheet_entries, only: [:create, :update, :destroy]
    end
    namespace :desktop do
      resource :current_timer, only: [:show, :update], controller: "current_timers"
    end
    namespace :mobile do
      resource :bootstrap, only: [:show], controller: "bootstrap"
      resource :current_timer, only: [:show, :update], controller: "current_timers"
      resources :time_tracking, only: [:index], path: "time-tracking", controller: "/api/v1/time_tracking"
      resources :timesheet_entries, only: [:index, :create, :update, :destroy], controller: "/api/v1/timesheet_entry"
      resource :otp, only: [], controller: "otps" do
        post :request, action: :create
        post :verify
      end
      resources :collections, only: [:index, :create]
    end
    namespace :agent do
      resource :capabilities, only: [:show], controller: "capabilities"
      resources :timesheet_entries, only: [:create]
    end
    resources :projects, only: [:index, :show, :create, :update, :destroy] do
      collection do
        get "search", to: "projects/search#index"
      end
    end
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

    # Compatibility-only route kept for existing frontend consumers.
    # InternalApi::V1::AnalyticsController is the canonical analytics backend interface.
    namespace :analytics do
      resources :revenue_forecasts, only: [:index]
    end

    resources :workspaces, only: [:index, :update]
    resource :subscription, only: [:show] do
      post :checkout
      post :portal
      post :trial
    end
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

    get "invoices/line_items", to: "invoices/line_items#index", as: :line_items_invoices

    resources :invoices, only: [:index, :create, :update, :show, :destroy, :edit] do
      member do
        post :send_invoice
        post :send_reminder
        post :razorpay_payment_link
        get :download
      end
    end
    resources :project_members, only: [:update]
    resources :employments, only: [:index, :show, :update]
    resources :timezones, only: [:index]

    concern :addressable do
      resources :addresses, only: %i[index create show update]
    end

    resources :companies, only: [:index, :create, :update], concerns: :addressable do
      resource :purge_logo, only: [:destroy], controller: "companies/purge_logo"
    end

    resources :currency_pairs, only: [] do
      collection do
        get :rate
      end
    end

    resources :team, only: [:index, :destroy, :update] do
      member { get "removal_impact" }
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
    patch "payments/settings/upi", to: "payment_settings#update_upi"
    patch "payments/settings/razorpay", to: "payment_settings#update_razorpay"
    post "payments/settings/stripe/connect", to: "payment_settings#connect_stripe"
    delete "payments/settings/stripe/disconnect", to: "payment_settings#destroy"
    get "calendars/redirect", to: "calendars#redirect", as: "redirect"
    get "calendars/callback", to: "calendars#callback", as: "callback"
    get "calendars/calendars", to: "calendars#calendars", as: "calendars"
    get "calendars/events/:calendar_id", to: "calendars#events", as: "events", calendar_id: /[^\/]+/

    namespace :payments do
      resources :providers, only: [:index, :update]
    end

    resources :payments, only: [:new, :create, :index, :show] do
      post :withdraw, on: :member
    end
    resources :holidays, only: [:update, :index], param: :year

    namespace :dashboard do
      resources :activities, only: [:index]
    end

    resources :dashboard, only: [:index]

    resources :users, concerns: :addressable do
      resources :previous_employments, only: [:create, :index, :show, :update], controller: "users/previous_employments"
      resources :devices, only: [:create, :index, :show, :update, :destroy], controller: "users/devices"
    end

    resource :profile, only: [:update], controller: "profile"

    resources :expenses, only: [:create, :index, :show, :update, :destroy] do
      member do
        patch :approve
        patch :reject
        patch :mark_paid
      end
    end
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

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    # Canonical analytics backend interface.
    get "analytics/revenue_forecast", to: "analytics#revenue_forecast"
    get "analytics/comparison", to: "analytics#comparison"
    get "analytics/client_analysis", to: "analytics#client_analysis"
    get "analytics/team_productivity", to: "analytics#team_productivity"
    get "analytics/expense_trends", to: "analytics#expense_trends"
    get "analytics/exports/:report_type", to: "analytics_exports#show"
    get "analytics/reports", to: "analytics_reports#index"
    post "analytics/reports", to: "analytics_reports#create"
    get "analytics/reports/:id", to: "analytics_reports#show"
    delete "analytics/reports/:id", to: "analytics_reports#destroy"
  end
end
