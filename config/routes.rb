# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations" }
  root "application#index"
  resources :dashboard, only: [:index]
  resources :time_trackings, only: [:index]
end
