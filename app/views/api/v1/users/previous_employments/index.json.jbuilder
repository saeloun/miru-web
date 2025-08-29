# frozen_string_literal: true

json.previous_employments previous_employments do |previous_employment|
  json.partial! "previous_employment", locals: { previous_employment: }
end
