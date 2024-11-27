# frozen_string_literal: true

# == Schema Information
#
# Table name: email_rate_limiters
#
#  id                          :bigint           not null, primary key
#  current_interval_started_at :datetime
#  number_of_emails_sent       :integer          default(0)
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  user_id                     :bigint           not null
#
# Indexes
#
#  index_email_rate_limiters_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class EmailRateLimiter < ApplicationRecord
  belongs_to :user
end
