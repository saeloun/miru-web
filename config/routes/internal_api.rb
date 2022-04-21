# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy, :show]
    resources :project, only: [:index]
    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
    resources :projects, only: [:index, :show, :create, :update, :destroy]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    resources :reports, only: [:index]
    resources :workspaces, only: [:update]
    resources :invoices, only: [:index, :create, :update] do
      post :send_invoice, on: :member
    end
    resources :generate_invoice, only: [:index, :show]
    resources :project_members, only: [:update]
    resources :company_users, only: [:index]

    namespace :teams do
      resources :transfer_wise, only: [:create]
    end
  end
end
