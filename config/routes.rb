# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             controllers: {
                 sessions: "users/sessions",
                 registrations: "users/registrations"
             }

  # Root path
  root "home#index"

  # Dynamic routes
  get "*path", to: "home#index", via: :all
end
