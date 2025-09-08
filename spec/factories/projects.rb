# frozen_string_literal: true

# == Schema Information
#
# Table name: projects
#
#  id           :bigint           not null, primary key
#  billable     :boolean          not null
#  description  :text
#  discarded_at :datetime
#  name         :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  client_id    :bigint           not null
#
# Indexes
#
#  index_projects_on_billable            (billable)
#  index_projects_on_client_id           (client_id)
#  index_projects_on_description_trgm    (description) USING gin
#  index_projects_on_discarded_at        (discarded_at)
#  index_projects_on_name_and_client_id  (name,client_id) UNIQUE
#  index_projects_on_name_trgm           (name) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#
FactoryBot.define do
  factory :project do
    client
    name { Faker::Name.unique.name[0..30] }
    description { "Blog site." }
    billable { false }
  end
end
