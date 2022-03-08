# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update]
    resources :project, only: [:index]
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    post "timesheet_entry/create_many", to: "timesheet_entry#create_many"
    delete "timesheet_entry/many" => "timesheet_entry#destroy_many"
  end
end
