  # frozen_string_literal: true

  namespace :api, defaults: { format: "json" } do
    namespace :v1 do
      resources :timesheet_entry, only: [:create]
      resources :sns_subscriptions, only: [:create]
    end
  end
