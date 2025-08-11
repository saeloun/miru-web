# frozen_string_literal: true

# == Schema Information
#
# Table name: vendors
#
#  id         :bigint           not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  company_id :bigint           not null
#
# Indexes
#
#  index_vendors_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
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
