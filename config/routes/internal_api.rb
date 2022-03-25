# frozen_string_literal: true

namespace :internal_api, defaults: { format: "json" } do
  namespace :v1 do
    resources :clients, only: [:index, :update, :destroy, :show]
<<<<<<< HEAD
    resources :project, only: [:index]
    resources :timesheet_entry do
      collection do
        resource :bulk_action, only: [:update, :destroy], controller: "timesheet_entry/bulk_action"
      end
    end
=======
    resources :projects, only: [:index, :show]
>>>>>>> ad71fe46d5b3b9d58058f19975ee5a7bb5b4b1b8
    resources :timesheet_entry, only: [:index, :create, :update, :destroy]
    resources :reports, only: [:index]
    resources :workspaces, only: [:update]
    resources :invoices, only: [:index, :show]
    resources :generate_invoice, only: [:index]
  end
end
