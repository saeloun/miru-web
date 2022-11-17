# frozen_string_literal: true

module SetCurrentDetails
  extend ActiveSupport::Concern

  included do
    before_action do
      Current.user = current_user
      Current.company = current_company
    end
  end
end
