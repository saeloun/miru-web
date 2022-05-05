# frozen_string_literal: true

class CountriesInfo
  def self.get_time_zones_by_alpha2
    tz_by_alpha2 = Hash.new([])
    ISO3166::Country.pluck(:alpha2).map do |alpha2|
      tz_by_alpha2[alpha2] = ISO3166::Country.find_country_by_alpha2(alpha2).timezones
    end
  end
end
