# == Schema Information
#
# Table name: clients
#
#  id         :integer          not null, primary key
#  name       :string           not null
#  email      :string           not null
#  phone      :string
#  address    :string
#  country    :string
#  timezone   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

# frozen_string_literal: true

class Client < ApplicationRecord
  has_many :projects
end
