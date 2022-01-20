# frozen_string_literal: true

namespace :internal_api do
  resources :clients, only: [:index]
end
