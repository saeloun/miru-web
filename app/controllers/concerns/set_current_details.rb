# frozen_string_literal: true

module SetCurrentDetails
  extend ActiveSupport::Concern

  included do
    before_action do
      Current.user = current_user
      Current.company = current_company
      Rails.event.set_context({ request_id: request.request_id, source: request.env["miru.event_source"] }.compact)
    end
  end
end
