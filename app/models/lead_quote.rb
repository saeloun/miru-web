# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_quotes
#
#  id           :bigint           not null, primary key
#  description  :string
#  discarded_at :datetime
#  name         :string
#  lead_id      :bigint           not null
#
# Indexes
#
#  index_lead_quotes_on_discarded_at  (discarded_at)
#  index_lead_quotes_on_lead_id       (lead_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_id => leads.id)
#
class LeadQuote < ApplicationRecord
  include Discard::Model

  belongs_to :lead
  has_and_belongs_to_many :lead_line_items

  def render_properties
    {
      id:, name:, description:, lead_line_items:
    }
  end
end
