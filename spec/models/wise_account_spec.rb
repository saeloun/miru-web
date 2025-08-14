# frozen_string_literal: true

# == Schema Information
#
# Table name: wise_accounts
#
#  id              :bigint           not null, primary key
#  source_currency :string
#  target_currency :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  profile_id      :string
#  recipient_id    :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_wise_accounts_on_company_id              (company_id)
#  index_wise_accounts_on_user_id                 (user_id)
#  index_wise_accounts_on_user_id_and_company_id  (user_id,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe WiseAccount, type: :model do
  describe "Validations" do
    subject { build(:wise_account) }

    describe "uniqueness validations" do
      it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:company_id) }
    end
  end
end
