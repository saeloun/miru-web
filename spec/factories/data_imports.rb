# frozen_string_literal: true

# == Schema Information
#
# Table name: data_imports
#
#  id            :bigint           not null, primary key
#  dry_run       :boolean          default(FALSE), not null
#  error_message :text
#  failed_rows   :integer          default(0), not null
#  finished_at   :datetime
#  imported_rows :integer          default(0), not null
#  kind          :string           default("time_entries"), not null
#  options       :jsonb            not null
#  row_errors    :jsonb            not null
#  skipped_rows  :integer          default(0), not null
#  source        :string           not null
#  started_at    :datetime
#  status        :string           default("pending"), not null
#  summary       :jsonb            not null
#  total_rows    :integer          default(0), not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  company_id    :bigint           not null
#  user_id       :bigint           not null
#
# Indexes
#
#  index_data_imports_on_company_id_and_created_at  (company_id,created_at)
#  index_data_imports_on_user_id                    (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :data_import do
    company
    user
    source { "harvest" }
    kind { "time_entries" }
    status { "pending" }
    dry_run { false }
    options { {} }
  end
end
