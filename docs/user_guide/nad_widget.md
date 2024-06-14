# NAD widget

NAD is an interactive widget that displays a Network Area Diagram's SVG, generated for example using the PyPowSyBl APIs, in a Jupyter notebook
The widget allows you to pan and zoom the diagram, to focus on a specific part when the network is large.

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
display_nad(svg, invalid_lf: bool = False) -> NadWidget
```

- svg: the input SVG, as str or class providing an svg and metadata representation
- invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.


```python
update_nad(nadwidget, svg, invalid_lf: bool = False)
```

- nadwidget: the existing widget to update
- svg: the input NAD's SVG
- invalid_lf: When True the opacity style for some of the displayed info's (e.g., active and reactive power) is decreased, making them barely visible in the diagram.
