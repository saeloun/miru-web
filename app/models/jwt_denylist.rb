# frozen_string_literal: true

# == Schema Information
#
# Table name: jwt_denylist
#
#  id  :integer          not null, primary key
#  jti :string           not null
#  exp :datetime         not null
#
# Indexes
#
#  index_jwt_denylist_on_jti  (jti)
#

class JwtDenylist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist

  self.table_name = "jwt_denylist"
end
