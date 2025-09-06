module ApplicationHelper
  def app_name
    @app_name ||= Rails.configuration.x.app_name || 'Miru Agency OS'
  end
end
