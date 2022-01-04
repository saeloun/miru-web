# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations", sessions: "users/sessions" }
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: "root#index"
  resources :dashboard, only: [:index]
  resources :time_trackings, only: [:index], path: "time-tracking"
  resources :company, only: [:new, :create]
end
