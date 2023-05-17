# frozen_string_literal: true

class TruncateUserNameToUser < ActiveRecord::Migration[7.0]
  def change
    User.find_each do |user|
      user.update(first_name: user.first_name&.[0..19], last_name: user.last_name&.[0..19])
    end
  end
end
