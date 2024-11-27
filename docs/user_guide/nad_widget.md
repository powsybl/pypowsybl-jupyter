# NAD widget

NAD is an interactive widget that displays a Network Area Diagram's SVG, generated for example using the PyPowSyBl APIs, in a Jupyter notebook
The widget allows you to pan and zoom the diagram, to focus on a specific part when the network is large. It is also possible to interactively move nodes by drag&drop (feature available with versions of pypowsybl equal to or greater than v1.8.1).

The following code, to be run in a notebook, first creates a network, then displays the NAD widget on it.

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import display_nad

network = pn.create_ieee9()

vlid=network.get_voltage_levels().index[2]
nad=display_nad(network.get_network_area_diagram(voltage_level_ids=vlid, depth=3))
display(nad)
```

![NAD widget](/_static/img/nad_1.png)

## Update a NAD widget

It is possible to update the widget's content through the update_nad API.
The code below updates the nad widget already displayed, with a new depth parameter.

```python
from pypowsybl_jupyter import update_nad

update_nad(nad, network.get_network_area_diagram(voltage_level_ids=vlid, depth=0))
```

## Widget API

```python
display_nad(svg, invalid_lf: bool = False, enable_callbacks: bool = False, grayout:  bool = False) -> NadWidget
```

- svg: the input SVG, as str or class providing an svg and metadata representation
- invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
- enable_callbacks: if True, enable the callbacks for selecting nodes (through a shift+click on a node) and moving nodes. Please note that this feature is working with versions of PyPowSyBl equal to or greater than v1.8.1.
- grayout: if True, changes the diagram elements' color to gray.


```python
update_nad(nadwidget, svg, invalid_lf: bool = False, enable_callbacks: bool = False, grayout:  bool = False)
```

- nadwidget: the existing widget to update
- svg: the input NAD's SVG
- invalid_lf: when True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
- enable_callbacks: if True, enable the callbacks for selecting nodes (through a SHIFT+CLICK on a node) and moving nodes. Please note that this feature is working with versions of PyPowSyBl equal to or greater than v1.8.1.
- grayout: if True, changes the diagram elements' color to gray.
- keep_viewbox: if True, keeps the current diagram content, including pan and zoom settings.

## Customize widget's interactions
By default, only the pan and zoom interactions with the diagram are active.

It is possible to customize the widget's behaviour to create more complex interactions (e.g., by integrating other widgets). 

Use these widget's methods to register a callback on a specific event:

- on_select_node
- on_move_node
- on_move_text_node

The [network explorer widget](/user_guide/network_explorer.md) demonstrates the approach.

Please note that the callbacks works with versions of PyPowSyBl equal or greater than v1.8.1.

Example: the code below activates a callback when a node is selected (through SHIFT+CLICK) in the widget (it prints the selected node's ID to the log).

```python
def select_node_callback_demo(event):
        print('Clicked node with ID: ' + str(event.selected_node['equipment_id']))

nad_widget=display_nad(network.get_network_area_diagram(depth=4), enable_callbacks=True)
nad_widget.on_select_node(select_node_callback_demo)
display(nad_widget)
```
