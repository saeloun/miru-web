# frozen_string_literal: true

json.client_details clients do |client|
  json.partial! "client", locals: { client: }
end
