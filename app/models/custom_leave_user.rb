# frozen_string_literal: true

# == Schema Information
#
# Table name: custom_leave_users
#
#  id              :integer          not null, primary key
#  custom_leave_id :integer          not null
#  user_id         :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_custom_leave_users_on_custom_leave_id  (custom_leave_id)
#  index_custom_leave_users_on_user_id          (user_id)
#

class CustomLeaveUser < ApplicationRecord
  belongs_to :custom_leave
  belongs_to :user
end
