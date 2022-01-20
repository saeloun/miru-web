# frozen_string_literal: true

class ActionDispatch::Routing::Mapper
  def draw(routes_name)
    instance_eval(File.read(Rails.root.join("config/routes/#{routes_name}.rb")))
  end
end

Rails.application.routes.draw do
  devise_for :users, controllers: { registrations: "users/registrations", sessions: "users/sessions" }
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: "root#index"
  draw(:internal_api)
  resources :dashboard, only: [:index]

  # get "*path", to: "home#index", via: :all
  resources :company, only: [:new, :create]
  resources :time_tracking, only: [:index], path: "time-tracking"
  resources :clients, only: [:new, :index]

  devise_scope :user do
    get "profile", to: "users/registrations#edit"
    delete "profile/purge_avatar", to: "users/registrations#purge_avatar"
  end

  # For opening the email in the web browser in non production environments
  if ENV["EMAIL_DELIVERY_METHOD"] == "letter_opener_web"
    mount LetterOpenerWeb::Engine, at: "/sent_emails"
  end
end
