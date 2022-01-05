# frozen_string_literal: true

months = ["JAN", "FEB", "MAR" "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

FactoryBot.define do
    factory :company do
      name { "Saeloun" }
      address { Faker::Address.full_address }
      business_phone { Faker::PhoneNumber.cell_phone_in_e164 }
      base_currency { Faker::Currency.code }
      standard_price { Faker::Number.number }
      fiscal_year_end { months.sample }
      date { Faker::Date.in_date_period }
      country { "USA" }
      timezone { "EST" }
    end
  end


#  id              :integer          not null, primary key
#  name            :string
#  address         :text
#  business_phone  :integer
#  base_currency   :decimal(, )
#  standard_price  :decimal(, )
#  fiscal_year_end :string
#  date            :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  country         :string
#  timezone        :string
