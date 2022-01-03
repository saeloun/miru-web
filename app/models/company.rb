# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users
end
