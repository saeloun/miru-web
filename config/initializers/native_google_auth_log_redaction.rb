# frozen_string_literal: true

require "console/adapter/rails/action_controller"

module NativeGoogleAuthLogRedaction
  BROKER_PATH = %r{\A/native/auth/google/[^/?]+}
  CALLBACK = %r{\Amiru-native-ios://auth/google(?:\?|\z)}
  FILTERED_CALLBACK = "miru-native-ios://auth/google?[FILTERED]"
  LoggedResponse = Struct.new(:headers)

  module RequestPath
    def filtered_path
      super.sub(BROKER_PATH, "/native/auth/google/[FILTERED]")
    end
  end

  module RedirectLocation
    def filtered_location
      value = super
      CALLBACK.match?(value) ? FILTERED_CALLBACK : value
    end
  end

  module ConsoleSubscriber
    def process_action(event)
      response = event.payload[:response]
      location = response&.headers&.[]("Location") || response&.headers&.[]("location")
      return super unless location.is_a?(String) && CALLBACK.match?(location)

      logged_event = event.dup
      logged_event.payload = event.payload.merge(response: LoggedResponse.new(
        response.headers.merge("Location" => FILTERED_CALLBACK, "location" => FILTERED_CALLBACK)))
      super(logged_event)
    end
  end
end

ActionDispatch::Request.prepend(NativeGoogleAuthLogRedaction::RequestPath)
ActionDispatch::Response.prepend(NativeGoogleAuthLogRedaction::RedirectLocation)
Console::Adapter::Rails::ActionController::LogSubscriber.prepend(NativeGoogleAuthLogRedaction::ConsoleSubscriber)
