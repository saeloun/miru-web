# frozen_string_literal: true

Rails.application.routes.draw do
  # Root path
  root "home#index"

  # Dynamic routes
  get "*path", to: "home#index", via: :all

  namespace :api do
  end

  namespace :v1 do
    # User Auhentication
    resources :sessions, only: [:create, :destroy]
  end
end
