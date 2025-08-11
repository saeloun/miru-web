# frozen_string_literal: true

# == Schema Information
#
# Table name: identities
#
#  id         :integer          not null, primary key
#  provider   :string
#  uid        :string
#  user_id    :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_identities_on_provider  (provider)
#  index_identities_on_user_id   (user_id)
#

class Identity < ApplicationRecord
  belongs_to :user

  scope :google_auth, -> { where(provider: "google_oauth2") }
end
