# frozen_string_literal: true

# == Schema Information
#
# Table name: notification_preferences
#
#  id                   :bigint           not null, primary key
#  notification_enabled :boolean          default(FALSE), not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  company_id           :bigint           not null
#  user_id              :bigint           not null
#
# Indexes
#
#  index_notification_preferences_on_company_id              (company_id)
#  index_notification_preferences_on_user_id                 (user_id)
#  index_notification_preferences_on_user_id_and_company_id  (user_id,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class NotificationPreference < ApplicationRecord
  belongs_to :user
  belongs_to :company

  validates :notification_enabled, inclusion: { in: [true, false] }
end
