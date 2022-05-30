# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_timelines
#
#  id         :bigint           not null, primary key
#  comment    :text
#  kind       :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  lead_id    :bigint           not null
#
# Indexes
#
#  index_lead_timelines_on_lead_id  (lead_id)
#
# Foreign Keys
#
#  fk_rails_...  (lead_id => leads.id)
#
class LeadTimeline < ApplicationRecord
  belongs_to :lead
end
