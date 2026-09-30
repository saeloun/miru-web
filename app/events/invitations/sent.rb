# frozen_string_literal: true

module Invitations
  class Sent < ApplicationEvent
    private

      def event_data
        { invitation_id: record.id, company_id: record.company_id, role: record.role }
      end
  end
end
