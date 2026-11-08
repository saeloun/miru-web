# frozen_string_literal: true

namespace :api, defaults: { format: "json" } do
  namespace :v1 do
    namespace :native do
      namespace :auth do
        resources :google_requests, only: :create, path: "google/requests"
        resources :google_exchanges, only: :create, path: "google/exchanges"
      end
    end
    namespace :users do
      devise_scope :user do
        post "login", to: "sessions#create", as: "login"
        delete "logout", to: "sessions#destroy", as: "logout"
        get "_me", to: "sessions#me", as: "me"
        get "second_factor", to: "sessions#second_factor"
        post "signup", to: "registrations#create", as: "signup"
        post "forgot_password", to: "passwords#create", as: "forgot_password"
        put "reset_password", to: "passwords#update", as: "reset_password"
        post "resend_confirmation_email", to: "confirmations#create", as: "resend_confirmation_email"
      end

      resources :passkeys, only: [:index, :create, :update, :destroy] do
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
          post :revoke_trusted_browsers
        end
      end

      resource :otp, only: [], controller: "otps" do
        post :request, action: :create
        post :verify
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

    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
    resources :imports, only: [:create, :show]
    resources :india_tax_estimates, only: [:index, :create]
    get "consultant_payroll", to: "consultant_payroll#index"
    get "payroll_pto/report", to: "payroll_pto#report"
    get "payroll_pto/:id", to: "payroll_pto#show"
    post "payroll_pto/:id/policy", to: "payroll_pto#policy"
    post "payroll_pto/:id/decisions", to: "payroll_pto#decisions"
    post "payroll_pto/:id/accrue", to: "payroll_pto#accrue"
    post "payroll_pto/:id/recoveries/:recovery_id/resolve", to: "payroll_pto#resolve_credit_review"
    get "consultant_payroll/:id/compensations", to: "consultant_payroll#history"
    post "consultant_payroll/:id/compensations", to: "consultant_payroll#create"
    post "consultant_payroll/:id/preview", to: "consultant_payroll#preview"
    resources :agreement_templates, only: [:index, :show, :create, :update] do
      post :import, on: :collection
    end
    resources :agreements, only: [:index, :show, :create, :update] do
      get :parties, on: :collection
      get :download, on: :member
    end
    resource :signature_connection, only: [:show, :create], controller: :signature_connections
    resources :signature_archives, only: :index do
      get "files/:key", on: :member, action: :download
    end
    resources :signature_requests, only: [:index, :show, :create, :update] do
      resources :operations, only: :create, controller: :signature_operations
      resource :review, only: :show, controller: :signature_request_reviews do
        post :invitations, action: :invite
        delete "invitations/:invitation_id", action: :revoke
        post :comments, action: :comment
        post :approval, action: :approve
      end
      member do
        post :sources
        get "revisions/:revision_id", action: :revision
        get "revisions/:revision_id/originals/:key", action: :original
      end
    end
    resources :tax_declarations, only: [:index, :show, :create] do
      member do
        post :submit
        post :review
        post :withdraw
        get "evidence/:evidence_id", action: :download
      end
    end
    resources :employee_reports, only: [:index, :create, :update, :destroy] do
      get :download, on: :member
    end
    resource :employee_record_settings, only: [:show, :update], controller: "employee_record_settings"
    resource :employee_records, only: [:show, :update], controller: "employee_records" do
      post :documents, action: :upload_document
      get "documents/:id", action: :download_document
      get :payments
      post :payments, action: :create_payment
    end
    resources :salary_slips, only: [:index, :create] do
      member do
        post :publish
        post :withdraw
        post :email
        get :download
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
      resources :collections, only: [:index, :create] do
        member do
          post :manual_payment
          post :payment_link
        end
      end
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
    resources :audit_logs, only: [:index]
    resource :sso_setting, only: [:show, :update]
    resources :support_requests, only: [:create]
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
        post :quickbooks_sync
        get :download
      end
    end
    resources :tax_configurations, only: [:index, :create, :update, :destroy]
    resources :project_members, only: [:update]
    resources :employments, only: [:index, :show, :update]
    resources :timezones, only: [:index]

    concern :addressable do
      resources :addresses, only: %i[index create show update]
    end

    resources :companies, only: [:index, :create, :update], concerns: :addressable do
      resource :purge_logo, only: [:destroy], controller: "companies/purge_logo"
      resource :invoice_signature, only: [:show, :create, :destroy], controller: "companies/invoice_signatures"
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
    patch "payments/settings/paypal", to: "payment_settings#update_paypal", as: :payments_settings_paypal
    delete "payments/settings/paypal", to: "payment_settings#disconnect_paypal"
    post "payments/settings/stripe/connect", to: "payment_settings#connect_stripe"
    delete "payments/settings/stripe/disconnect", to: "payment_settings#destroy"
    namespace :integrations do
      get "quickbooks/status", to: "quickbooks#status"
      post "quickbooks/connect", to: "quickbooks#connect"
      get "quickbooks/callback", to: "quickbooks#callback"
      delete "quickbooks/disconnect", to: "quickbooks#disconnect"
      patch "quickbooks/settings", to: "quickbooks#settings"
      post "quickbooks/sync", to: "quickbooks#sync"
    end
    get "calendars/redirect", to: "calendars#redirect", as: "redirect"
    get "calendars/callback", to: "calendars#callback", as: "callback"
    get "calendars/calendars", to: "calendars#calendars", as: "calendars"
    get "calendars/events/:calendar_id", to: "calendars#events", as: "events", calendar_id: /[^\/]+/

    namespace :payments do
      resources :providers, only: [:index, :update]
    end

    resources :payments, only: [:new, :create, :index, :show] do
      post :withdraw, on: :member
      post :quickbooks_sync, on: :member
      get :bulk_download, on: :collection
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

    namespace :hiring do
      get :pipeline, to: "pipeline#index"
      post "pipeline/search", to: "pipeline#search"
      resources :interview_feedback, only: [:index, :show, :update]
      resources :interview_reviews, only: [:index, :show] do
        get :feedback, on: :member
        get :resume, on: :member
        get "assignments/:assignment_id/files/:attachment_id", on: :member, action: :download
      end
      resources :panel_members, only: [:index, :create, :update] do
        post :search, on: :collection
      end
      resources :assignment_reviews, only: [:index, :show] do
        post :reviews, on: :member, action: :create
        get "files/:attachment_id", on: :member, action: :download
      end
      resources :assignment_templates, only: [:index, :show, :create, :update] do
        post :search, on: :collection
        post :approve, on: :member
        post :archive, on: :member
      end
      resource :settings, only: [:show, :update] do
        post :approve
      end
      resources :mailboxes, only: [:index, :create, :update] do
        post :search, on: :collection
      end
      resources :receipts, only: [:index, :show, :create] do
        member do
          post :accept
          post :dismiss
          post :reprocess
          post :acknowledgement
          post "messages/:message_id/retry", action: :retry_acknowledgement
          post "messages/:message_id/reconcile", action: :reconcile_acknowledgement
          get :source
          get "attachments/:attachment_index", action: :attachment
        end
      end
      resources :applications, only: [:index, :show, :create] do
        resource :retention, only: [:show, :destroy], controller: :retention
        resources :interviews, only: [:index, :create, :update] do
          resources :messages, only: [:index, :create], controller: :candidate_messages do
            post :preview, on: :collection
            post :retry, on: :member
            post :reconcile, on: :member
          end
          resources :bookings, only: [:index, :create, :update] do
            post :import, on: :collection
            resources :messages, only: [:index, :create], controller: :candidate_messages do
              post :preview, on: :collection
              post :retry, on: :member
              post :reconcile, on: :member
            end
          end
          resources :calendar_events, only: :index
          resources :feedback, only: :index, controller: :interview_feedback_history do
            resources :messages, only: :index, controller: :feedback_messages do
              post :preview, on: :collection
              post :retry, on: :member
              post :reconcile, on: :member
            end
          end
        end
        post :search, on: :collection
        resources :assignments, only: [:index, :create] do
          post :reassign, on: :member
          post :decision, on: :member
          get "files/:attachment_id", on: :member, action: :download
          resources :messages, only: [:index, :create], controller: :assignment_messages do
            post :preview, on: :collection
            post :retry, on: :member
            post :reconcile, on: :member
          end
        end
        resources :screenings, only: [:index, :create]
        resources :offers, only: [:index, :create, :update] do
          resources :onboarding, only: [:index, :create], controller: "onboarding" do
            post :renew, on: :collection
            post :complete, on: :collection
          end
          post :issue, on: :member
          post :revoke, on: :member
          resources :messages, only: [:index, :create], controller: :offer_messages do
            post :preview, on: :collection
            post :retry, on: :member
            post :reconcile, on: :member
          end
        end
        resources :decisions, only: [:index, :create, :update] do
          post :finalize, on: :member
          resources :messages, only: [:index, :create], controller: :decision_messages do
            post :preview, on: :collection
            post :retry, on: :member
            post :reconcile, on: :member
          end
        end
        resources :forms, only: [:index, :create, :destroy] do
          get :resume, on: :member
        end
      end
      get "owners", to: "applications#owners"
      post "owners/search", to: "applications#search_owners"
      resources :roles, only: [:index, :create, :update] do
        post :search, on: :collection
      end
    end

    resource :profile, only: [:update], controller: "profile"

    resource :payroll_mercury_connection, only: [:update] do
      post :verify
      post :recipients
    end

    resources :payroll_runs, only: [:index, :show, :create] do
      member do
        get :preflight
        get :preparation
        post :revisions
        post :approvals
      end
      resources :mercury_payments, only: [:index, :create], controller: "payroll_mercury_payments" do
        member do
          post :submit
          post :void
          post :refresh
          post :reconcile
          post :confirm_request
          post :attest_absence
          post :record_credit
          post :resolve_shortfall
        end
      end
      resources :india_handoffs, only: [:index, :create], controller: "payroll_india_handoffs" do
        member do
          post :retry_delivery
          post :void
          post :reconcile_delivery
          post :record_credit
        end
      end
      resources :split_arrangements, only: [:create], controller: "payroll_split_arrangements" do
        member do
          post :verify
          post :approve
          post :withdraw
        end
      end
    end

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
