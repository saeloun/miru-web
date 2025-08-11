# frozen_string_literal: true
# == Schema Information
#
# Table name: client_members
#
#  id           :integer          not null, primary key
#  client_id    :integer          not null
#  user_id      :integer          not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :integer          not null
#  discarded_at :datetime
#
# Indexes
#
#  index_client_members_on_client_id              (client_id)
#  index_client_members_on_client_id_and_user_id  (client_id,user_id) UNIQUE
#  index_client_members_on_company_id             (company_id)
#  index_client_members_on_discarded_at           (discarded_at)
#  index_client_members_on_user_id                (user_id)
#

class ClientMember < ApplicationRecord
  include Discard::Model

  belongs_to :client
  belongs_to :user
  belongs_to :company

  validates_uniqueness_of :client_id, scope: :user_id, message: "A client member with this client and user already exists"
end
