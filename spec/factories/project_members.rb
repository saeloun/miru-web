# frozen_string_literal: true

# == Schema Information
#
# Table name: project_members
#
#  id           :bigint           not null, primary key
#  discarded_at :datetime
#  hourly_rate  :decimal(, )      default(0.0), not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  project_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_project_members_on_discarded_at            (discarded_at)
#  index_project_members_on_project_id              (project_id)
#  index_project_members_on_user_id                 (user_id)
#  index_project_members_on_user_project_discarded  (user_id,project_id,discarded_at)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :project_member do
    user
    project
    hourly_rate { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
  end
end
