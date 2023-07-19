# frozen_string_literal: true

# == Schema Information
#
# Table name: client_members
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  client_id  :bigint           not null
#  company_id :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_client_members_on_client_id   (client_id)
#  index_client_members_on_company_id  (company_id)
#  index_client_members_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class ClientMember < ApplicationRecord
  belongs_to :client
  belongs_to :user
  belongs_to :company
end
