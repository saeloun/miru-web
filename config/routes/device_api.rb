# frozen_string_literal: true

namespace :device_api, defaults: { format: "json" } do
  resources :devices, only: [:create, :update]
  resources :device_usages, only: [:create, :update]
end
