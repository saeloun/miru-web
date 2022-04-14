# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id project.id
json.name project.name
json.description project.description
json.billable project.billable
