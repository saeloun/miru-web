# frozen_string_literal: true

# == Schema Information
#
# Table name: consultancies
#
#  id           :bigint           not null, primary key
#  address      :string
#  discarded_at :datetime
#  email        :string
#  name         :string
#  phone        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_consultancies_on_discarded_at  (discarded_at)
#
class Consultancy < ApplicationRecord
  include Discard::Model

  validates :name, presence: true
  validates :email, uniqueness: true, format: { with: Devise.email_regexp }

  has_many :candidates, dependent: :destroy

  def consultancy_detail
    {
      id:, name:, email:, address:, phone:, candidates:
    }
  end
end
