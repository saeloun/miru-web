# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  calendar_connected     :boolean          default(TRUE)
#  calendar_enabled       :boolean          default(TRUE)
#  confirmation_sent_at   :datetime
#  confirmation_token     :string
#  confirmed_at           :datetime
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :string
#  date_of_birth          :date
#  discarded_at           :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string           not null
#  last_name              :string           not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  phone                  :string
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  social_accounts        :jsonb
#  token                  :string(50)
#  uid                    :string
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  personal_email_id      :string
#
# Indexes
#
#  index_users_on_confirmation_token    (confirmation_token)
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_email_trgm            (email) USING gin
#  index_users_on_first_name_trgm       (first_name) USING gin
#  index_users_on_last_name_trgm        (last_name) USING gin
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#
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
