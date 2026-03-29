# frozen_string_literal: true

class Identity < ApplicationRecord
  belongs_to :user

  scope :google_auth, -> { where(provider: "google_oauth2") }
  scope :github_auth, -> { where(provider: "github") }
end
