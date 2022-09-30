# frozen_string_literal: true

class ActiveSupport::TimeWithZone
  def ordinalize(year: true)
    if year
      self.strftime("%B #{self.day.ordinalize}, %Y")
    else
      self.strftime("%B #{self.day.ordinalize}")
    end
  end
end
