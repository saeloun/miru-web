# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Define an application-wide HTTP permissions policy. For further
# information see: https://developers.google.com/web/updates/2018/06/feature-policy

Rails.application.config.permissions_policy do |policy|
  policy.accelerometer :none
  policy.camera :none
  policy.geolocation :none
  policy.gyroscope :none
  policy.magnetometer :none
  policy.microphone :none
  policy.usb :none
  policy.fullscreen :self
  policy.payment :self
end
