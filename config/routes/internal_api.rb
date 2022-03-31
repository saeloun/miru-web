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
    resources :projects, only: [:index, :show]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    resources :reports, only: [:index]
    resources :workspaces, only: [:update]
    resources :invoices, only: [:index]
    resources :generate_invoice, only: [:index]
  end
end
