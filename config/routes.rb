# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations" }

  root "dashboard#index"
  resources :dashboard, only: [:index]
  resources :company, only: [:new, :create]

  get "*path", to: "home#index", via: :all
end
