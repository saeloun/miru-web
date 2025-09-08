# frozen_string_literal: true

# == Schema Information
#
# Table name: invitations
#
#  id               :bigint           not null, primary key
#  accepted_at      :datetime
#  expired_at       :datetime
#  first_name       :string
#  last_name        :string
#  recipient_email  :string           not null
#  role             :integer          default("owner"), not null
#  token            :string           not null
#  virtual_verified :boolean          default(FALSE)
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  client_id        :bigint
#  company_id       :bigint           not null
#  sender_id        :bigint           not null
#
# Indexes
#
#  index_invitations_on_accepted_at           (accepted_at)
#  index_invitations_on_client_id             (client_id)
#  index_invitations_on_company_id            (company_id)
#  index_invitations_on_expired_at            (expired_at)
#  index_invitations_on_first_name_trgm       (first_name) USING gin
#  index_invitations_on_last_name_trgm        (last_name) USING gin
#  index_invitations_on_recipient_email       (recipient_email)
#  index_invitations_on_recipient_email_trgm  (recipient_email) USING gin
#  index_invitations_on_role                  (role)
#  index_invitations_on_sender_id             (sender_id)
#  index_invitations_on_token                 (token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (sender_id => users.id)
#
FactoryBot.define do
  factory :invitation do
    company
    sender { build(:user) }
    first_name { Faker::Name.first_name.gsub(/\W/, "") }
    last_name { Faker::Name.last_name.gsub(/\W/, "") }
    recipient_email { Faker::Internet.email }
    role { "employee" }
    token { Faker::Lorem.characters(number: 10) }
    expired_at { Date.current + 1.day }
  end
end
