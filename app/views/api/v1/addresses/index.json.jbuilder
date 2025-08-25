# frozen_string_literal: true

json.addresses addresses do |address|
  json.partial! "address", locals: { address: }
end
