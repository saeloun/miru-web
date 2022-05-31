# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_line_items
#
#  id                       :bigint           not null, primary key
#  description              :text
#  discarded_at             :datetime
#  kind                     :integer
#  name                     :string
#  number_of_resource       :integer
#  price                    :float
#  resource_expertise_level :integer
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  lead_id                  :bigint           not null
#
# Indexes
#
#  index_lead_line_items_on_discarded_at  (discarded_at)
#  index_lead_line_items_on_lead_id       (lead_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_id => leads.id)
#
class LeadLineItem < ApplicationRecord
  include Discard::Model
  belongs_to :lead

  def render_properties
    {
      id:, name:, kind:, description:, price:,
      number_of_resource:, resource_expertise_level:
    }
  end
end
