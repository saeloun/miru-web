# frozen_string_literal: true

# == Schema Information
#
# Table name: engagement_timestamps
#
#  id                   :bigint           not null, primary key
#  engage_code          :integer
#  engage_updated_at    :datetime
#  week_code            :integer
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  engage_updated_by_id :bigint
#  user_id              :bigint           not null
#
# Indexes
#
#  index_engagement_timestamps_on_engage_updated_by_id  (engage_updated_by_id)
#  index_engagement_timestamps_on_user_id               (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (engage_updated_by_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class EngagementTimestamp < ApplicationRecord
  SimpleKlass = Struct.new(:name, :id)

  belongs_to :user
  belongs_to :engage_updated_by, class_name: :User, optional: true

  ENGAGEMENT_OPTIONS = [
    SimpleKlass.new("Free", 1),
    SimpleKlass.new("Partially", 2),
    SimpleKlass.new("Fully", 3),
    SimpleKlass.new("Over", 4),
  ]

  class << self
    def current_week_code
      "#{Date.current.cweek}#{Date.current.year}"
    end

    def previous_week_code
      "#{(Date.current - 1.week).cweek}#{(Date.current - 1.week).year}"
    end

    def current_week_due_at
      Time.current.end_of_week
    end

    def current_engage_expires_at
      (Time.current + 1.week).end_of_week
    end
  end

  def engage_name
    return "" if engage_code.nil?

    ENGAGEMENT_OPTIONS.group_by(&:id).transform_values { |val| val.first.name }[engage_code]
  end
end
