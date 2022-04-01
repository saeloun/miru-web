# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy, :show]
    resources :projects, only: [:index, :show]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    resources :reports, only: [:index]
    resources :workspaces, only: [:update]
    resources :invoices, only: [:index]
    resources :generate_invoice, only: [:index]
    get "/current_workspace/users", to: "workspaces#users"
    put "/projects/:id/members", to: "projects#update_members"
  end
end
