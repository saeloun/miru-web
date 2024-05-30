# frozen_string_literal: true

# == Schema Information
#
# Table name: carryovers
#
#  id                  :bigint           not null, primary key
#  discarded_at        :datetime
#  duration            :integer
#  from_year           :integer
#  to_year             :integer
#  total_leave_balance :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  company_id          :bigint           not null
#  leave_type_id       :bigint           not null
#  user_id             :bigint           not null
#
# Indexes
#
#  index_carryovers_on_company_id     (company_id)
#  index_carryovers_on_discarded_at   (discarded_at)
#  index_carryovers_on_leave_type_id  (leave_type_id)
#  index_carryovers_on_user_id        (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (leave_type_id => leave_types.id)
#  fk_rails_...  (user_id => users.id)
#
class Carryover < ApplicationRecord
  include Discard::Model

  belongs_to :user
  belongs_to :company
  belongs_to :leave_type

  validates :from_year, :to_year, :total_leave_balance, :duration, presence: true
end
