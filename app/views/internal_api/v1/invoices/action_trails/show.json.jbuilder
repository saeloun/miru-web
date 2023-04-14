# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.trails trails do | trail |
    json.extract! trail :type, :user_name, :avatar, :created_at, :emails, :mode
end
