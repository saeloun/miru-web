# frozen_string_literal: true

# == Schema Information
#
# Table name: custom_leave_users
#
#  id              :bigint           not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  custom_leave_id :bigint           not null
#  user_id         :bigint           not null
#
# Indexes
#
#  index_custom_leave_users_on_custom_leave_id  (custom_leave_id)
#  index_custom_leave_users_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (custom_leave_id => custom_leaves.id)
#  fk_rails_...  (user_id => users.id)
#

class CustomLeaveUser < ApplicationRecord
  belongs_to :custom_leave
  belongs_to :user
end
