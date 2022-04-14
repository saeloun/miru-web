# frozen_string_literal: true

# This patches rspec-rails to support rails 7.0 https://github.com/rspec/rspec-rails/issues/2531
module RSpec
  module Rails
    module Matchers
      class HaveEnqueuedMail
        def legacy_mail?(job)
          defined?(ActionMailer::DeliveryJob) && job[:job] <= ActionMailer::DeliveryJob
        end

        def parameterized_mail?(job)
          RSpec::Rails::FeatureCheck.has_action_mailer_parameterized? && job[:job] <= ActionMailer::MailDeliveryJob
        end

        def unified_mail?(job)
          RSpec::Rails::FeatureCheck.has_action_mailer_unified_delivery? && job[:job] <= ActionMailer::MailDeliveryJob
        end
      end
    end
  end
end
