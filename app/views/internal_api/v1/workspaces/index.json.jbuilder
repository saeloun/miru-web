# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.workspaces workspaces do |workspace|
  json.id workspace.id
  json.logo workspace.company_logo
  json.name workspace.name
end
