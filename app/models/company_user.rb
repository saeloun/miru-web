# frozen_string_literal: true

# == Schema Information
#
# Table name: company_users
#
#  id         :integer          not null, primary key
#  company_id :integer          not null
#  user_id    :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_company_users_on_company_id  (company_id)
#  index_company_users_on_user_id     (user_id)
#

class CompanyUser < ApplicationRecord
  belongs_to :company
  belongs_to :user
end
