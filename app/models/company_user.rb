# frozen_string_literal: true

# == Schema Information
#
# Table name: company_users
#
#  id           :bigint           not null, primary key
#  discarded_at :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_company_users_on_company_id    (company_id)
#  index_company_users_on_discarded_at  (discarded_at)
#  index_company_users_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#

class CompanyUser < ApplicationRecord
  include Discard::Model

  belongs_to :company
  belongs_to :user
  has_one :employment_detail, dependent: :destroy
end
