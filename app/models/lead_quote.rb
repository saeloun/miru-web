# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_quotes
#
#  id             :bigint           not null, primary key
#  description    :string
#  discarded_at   :datetime
#  name           :string
#  status         :string
#  status_comment :text
#  lead_id        :bigint           not null
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
  has_many :quote_line_items
  accepts_nested_attributes_for :quote_line_items, allow_destroy: true

  def render_properties
    {
      id:, name:, description:, quote_line_items:
    }
  end
end
