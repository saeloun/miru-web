# frozen_string_literal: true

# == Schema Information
#
# Table name: client_members
#
#  id           :bigint           not null, primary key
#  discarded_at :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  client_id    :bigint           not null
#  company_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_client_members_on_client_id              (client_id)
#  index_client_members_on_client_id_and_user_id  (client_id,user_id) UNIQUE
#  index_client_members_on_company_id             (company_id)
#  index_client_members_on_discarded_at           (discarded_at)
#  index_client_members_on_user_id                (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :client_member do
    user
    client
    company
  end
end
