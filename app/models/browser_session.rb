# frozen_string_literal: true

class BrowserSession < ApplicationRecord
  belongs_to :user

  validates :token_digest, presence: true
end
