# frozen_string_literal: true

namespace :device_api, defaults: { format: "json" } do
  resources :devices, only: [:create] do
    post :find, on: :collection
    post :certify, on: :collection
    put :update_availability, on: :member

    resources :device_usages, only: [] do
      put :approve, on: :collection
    end
  end
end
