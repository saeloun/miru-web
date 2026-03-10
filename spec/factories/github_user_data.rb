# frozen_string_literal: true

FactoryBot.define do
  factory :github_user_data, class: OpenStruct do
    provider { "github" }
    uid { "42424242" }
    info {
      OpenStruct.new(
        name: "Octo Cat",
        email: "octo@example.com",
        first_name: "Octo",
        last_name: "Cat",
        nickname: "octocat"
      )
    }
    extra {
      OpenStruct.new(
        all_emails: [
          { "email" => "octo@example.com", "primary" => true, "verified" => true },
          { "email" => "secondary@example.com", "primary" => false, "verified" => true }
        ]
      )
    }
  end
end
