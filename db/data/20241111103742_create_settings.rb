# frozen_string_literal: true

class CreateSettings < ActiveRecord::Migration[7.1]
  def up
    User.find_each do |user|
      user.email_rate_limiter.create!
    end
  end

  def down
    EmailRateLimiter.destroy_all
  end
end
