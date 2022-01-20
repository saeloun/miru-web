# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations", sessions: "users/sessions" }
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: "root#index"
  resources :dashboard, only: [:index]

  # get "*path", to: "home#index", via: :all
  resource :company, only: [:new, :edit, :create, :update] do
    delete :purge_logo
  end
  resources :time_tracking, only: [:index], path: "time-tracking"

  #
  get "company", to: "company#edit"
  delete "company/purge_logo", to: "company#purge_logo"

  devise_scope :user do
    get "profile", to: "users/registrations#edit"
    delete "profile/purge_avatar", to: "users/registrations#purge_avatar"
  end

  # For opening the email in the web browser in non production environments
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web"
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end
end
