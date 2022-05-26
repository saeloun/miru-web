# frozen_string_literal: true

# == Schema Information
#
# Table name: leads
#
#  id             :bigint           not null, primary key
#  address        :text
#  country_code   :string
#  description    :string
#  donotbulkemail :boolean
#  donotemail     :boolean
#  donotfax       :boolean
#  donotphone     :boolean
#  industry       :string
#  industry_code  :integer
#  linkedinid     :string
#  mobilephone    :string
#  name           :string
#  other_email    :string
#  primary_email  :string
#  priority_code  :integer
#  quality_code   :integer
#  skypeid        :string
#  state_code     :integer
#  telephone      :string
#  timezone       :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class Lead < ApplicationRecord
end
