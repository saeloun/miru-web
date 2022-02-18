# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update]
    resources :project, only: [:index]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
  end
end
