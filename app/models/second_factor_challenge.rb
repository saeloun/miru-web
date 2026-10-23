# frozen_string_literal: true

class SecondFactorChallenge < ApplicationRecord
  belongs_to :user
end
