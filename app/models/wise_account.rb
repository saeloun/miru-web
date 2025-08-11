# frozen_string_literal: true

# == Schema Information
#
# Table name: wise_accounts
#
#  id              :integer          not null, primary key
#  profile_id      :string
#  recipient_id    :string
#  source_currency :string
#  target_currency :string
#  user_id         :integer          not null
#  company_id      :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_wise_accounts_on_company_id              (company_id)
#  index_wise_accounts_on_user_id                 (user_id)
#  index_wise_accounts_on_user_id_and_company_id  (user_id,company_id) UNIQUE
#

class WiseAccount < ApplicationRecord
  belongs_to :user
  belongs_to :company

  validates :user_id, uniqueness: { scope: :company_id }
end
