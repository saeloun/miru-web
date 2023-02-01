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
  validates :name, presence: true

  has_many :expenses
  belongs_to :company

  after_commit :reindex_expenses

  def reindex_expenses
    expenses.reindex
  end
end
