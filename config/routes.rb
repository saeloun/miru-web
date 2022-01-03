# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations" }
  root "time_trackings#index"
  resources :dashboard, only: [:index]
end
