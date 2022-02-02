# frozen_string_literal: true

namespace :internal_api do
  namespace :v1 do
    resources :clients, only: [:index]
  end
end
