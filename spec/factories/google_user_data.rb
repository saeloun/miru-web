# frozen_string_literal: true

FactoryBot.define do
  factory :google_user_data, class: OpenStruct do
    provider { "google_oauth2" }
    uid { "100000000000000000000" }
    info {
      OpenStruct.new(
        name: "John Smith",
        email: "john@example.com",
        first_name: "John",
        last_name: "Smith",
        image: "https://lh4.googleusercontent.com/photo.jpg",
        urls: {
          google: "https://plus.google.com/+JohnSmith"
        }
      )
    }
  end
end
