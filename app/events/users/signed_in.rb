# frozen_string_literal: true

module Users
  class SignedIn < ApplicationEvent
    def initialize(user, sign_in_method:)
      @sign_in_method = sign_in_method.to_sym
      super(user, actor: user)
    end

    private

      def event_data
        { user_id: record.id, sign_in_method: @sign_in_method }
      end
  end
end
