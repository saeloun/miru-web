# frozen_string_literal: true

class CustomLeaveUser < ApplicationRecord
  belongs_to :custom_leave
  belongs_to :user
end
