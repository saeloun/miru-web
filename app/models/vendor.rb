# frozen_string_literal: true

class Vendor < ApplicationRecord
  include Searchable

  pg_search_scope :pg_search,
    against: [:name],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "simple"
      }
    }

  validates :name, presence: true

  has_many :expenses
  belongs_to :company
end
