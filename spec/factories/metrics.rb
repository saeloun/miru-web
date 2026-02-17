# frozen_string_literal: true

# == Schema Information
#
# Table name: metrics
#
#  id             :bigint           not null, primary key
#  calculated_at  :datetime         not null
#  data           :jsonb            not null
#  metadata       :jsonb
#  metric_type    :string           not null
#  period         :string           not null
#  period_date    :date
#  trackable_type :string           not null
#  value_avg      :decimal(20, 2)   default(0.0)
#  value_count    :integer          default(0)
#  value_max      :decimal(20, 2)
#  value_min      :decimal(20, 2)
#  value_sum      :decimal(20, 2)   default(0.0)
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  trackable_id   :bigint           not null
#
# Indexes
#
#  index_metrics_on_calculated_at                  (calculated_at)
#  index_metrics_on_data                           (data) USING gin
#  index_metrics_on_metadata                       (metadata) USING gin
#  index_metrics_on_metric_type                    (metric_type)
#  index_metrics_on_period                         (period)
#  index_metrics_on_period_date                    (period_date)
#  index_metrics_on_trackable                      (trackable_type,trackable_id)
#  index_metrics_on_trackable_and_type_and_period  (trackable_type,trackable_id,metric_type,period,period_date) UNIQUE
#
FactoryBot.define do
  factory :metric do
    association :trackable, factory: :client
    metric_type { "hours_logged" }
    period { "week" }
    period_date { Date.current.beginning_of_week }
    data { { "total_minutes" => 0 } }
    value_sum { 0 }
    value_count { 0 }
    value_avg { 0 }
    metadata { {} }
    calculated_at { Time.current }
  end
end
