# == Schema Information
#
# Table name: user_members
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  member_id  :bigint
#  user_id    :bigint
#
# Indexes
#
#  index_user_members_on_member_id  (member_id)
#  index_user_members_on_user_id    (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (member_id => users.id)
#

# frozen_string_literal: true

class UserMember < ApplicationRecord
  belongs_to :user
  belongs_to :member, class_name: :User

  validates :member_id, :user_id, presence: true
end
