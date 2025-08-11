# frozen_string_literal: true

# == Schema Information
#
# Table name: vendors
#
#  id         :integer          not null, primary key
#  name       :string
#  company_id :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_vendors_on_company_id  (company_id)
#

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
