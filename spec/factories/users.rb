# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name.gsub(/\W/, "") }
    last_name { Faker::Name.last_name.gsub(/\W/, "") }
    email { Faker::Internet.email }
    password { Faker::Internet.password }
    confirmed_at { Date.today }
    date_of_birth { Faker::Date.between(from: "1990-01-01", to: "2000-01-01") }
    phone { Faker::PhoneNumber.phone_number_with_country_code }
    personal_email_id { Faker::Internet.email }
    current_workspace factory: :company

    after :create do |user|
      create(:email_rate_limiter, user:)
    end

    trait :with_avatar do
      transient do
        upload_file_name { "test-image.png" }
      end

      after :build do |user, evaluator|
        file_name = evaluator.upload_file_name
        file_path = Rails.root.join("spec", "support", "fixtures", file_name)
        user.avatar.attach(io: File.open(file_path), filename: file_name, content_type: "image/png")
      end
    end
  end
end
