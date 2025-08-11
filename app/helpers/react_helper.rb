# frozen_string_literal: true

module ReactHelper
  def react_component(component_name, props = {}, options = {})
    # Generate a unique ID for the component
    component_id = "react-component-#{SecureRandom.uuid}"

    # Convert props to JSON
    props_json = props.to_json

    # Create the container div and initialization script
    content_tag(:div, "", id: component_id, data: { component: component_name, props: props_json }) +
    javascript_tag(<<~JS)
      document.addEventListener('DOMContentLoaded', function() {
        var container = document.getElementById('#{component_id}');
        if (container && window.#{component_name}) {
          var props = JSON.parse(container.dataset.props || '{}');
          ReactDOM.render(React.createElement(window.#{component_name}, props), container);
        }
      });
    JS
  end
end
