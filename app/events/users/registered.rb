# frozen_string_literal: true

module Users
  class Registered < ApplicationEvent
    def initialize(user)
      super(user, actor: Current.user || user)
    end

    private

      def event_data
        { user_id: record.id }
      end
  end
end
