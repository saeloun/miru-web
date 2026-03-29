# frozen_string_literal: true

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.base_uri :self
    policy.font_src :self, :https, :data
    policy.img_src :self, :https, :data, :blob
    policy.object_src :none
    policy.script_src :self, :https, :unsafe_inline
    policy.style_src :self, :https, :unsafe_inline
    policy.connect_src :self, :https
    policy.frame_ancestors :self

    if Rails.env.development?
      vite_host = ViteRuby.config.host_with_port

      policy.script_src(*policy.script_src, :unsafe_eval, "http://#{vite_host}", "ws://#{vite_host}")
      policy.style_src(*policy.style_src, "http://#{vite_host}")
      policy.connect_src(*policy.connect_src, "http://#{vite_host}", "ws://#{vite_host}")
    end
  end

  config.content_security_policy_report_only = Rails.env.development?
end
