# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations", sessions: "users/sessions" }
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: "root#index"
  resources :dashboard, only: [:index]
  resources :company, only: [:new, :create]

  # get "*path", to: "home#index", via: :all
  resources :company, only: [:new, :create]
  resources :time_trackings, only: [:index], path: "time-tracking"

  # For opening the email in the web browser in non production environments
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web"
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end
end
