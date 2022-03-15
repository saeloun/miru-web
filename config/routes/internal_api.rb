# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy]
    resources :project, only: [:index]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    resources :reports, only: [:index]
    resources :workspaces, only: [:update]
  end
end
