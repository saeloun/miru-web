# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users

  root "home#index"
  get "*path", to: "home#index", via: :all
end
