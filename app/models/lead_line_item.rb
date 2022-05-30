# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_line_items
#
#  id                       :bigint           not null, primary key
#  description              :text
#  kind                     :integer
#  name                     :string
#  numbert_of_resource      :integer
#  price                    :float
#  resource_expertise_level :integer
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  lead_id                  :bigint           not null
#
# Indexes
#
#  index_lead_line_items_on_lead_id  (lead_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_id => leads.id)
#
class LeadLineItem < ApplicationRecord
  belongs_to :lead
end
