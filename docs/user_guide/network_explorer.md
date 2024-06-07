# Network explorer widget

Network explorer is interactive network explorer widget, built on pypowsybl-jupyter's widgets (SLD and NAD) and some standard [ipywidgets](https://ipywidgets.readthedocs.io/en/stable/index.html): select lists, tabs, etc.

Through the widget, you can select a voltage level from the list (or search of a specific one using the Filter) and the NAD and SLD diagrams for that voltage level will be displayed in the two "Network Area" and "Single Line" tabs, respectively. Both diagrams can be panned and zoomed.

The following code, to be run in a notebook, first creates a network, then displays the network explorer on it.

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import network_explorer

network=pn.create_four_substations_node_breaker_network()

network_explorer(network)
```

##  Network Area tab

The selected voltage level is the displayed NAD's center. 

![network-explorer  NAD tab](/_static/img/network_explorer_1.png)

A 'depth' slider controls the size of the sub network.

## Single Line tab

![network-explorer SLD tab](/_static/img/network_explorer_2.png)

By clicking on an arrow in the SLD you can navigate to another voltage level. 

Switches can also be clicked, causing their status in the network to change; Please note that, currently, this action does not trigger any computation on the network  (e.g., a LF is not   automatically run on the network).


## Widget API

Other than the target network, the Network explorer can be customized using additional parameters:

```python
network_explorer(network: Network, vl_id : str = None, depth: int = 0, high_nominal_voltage_bound: float = -1, low_nominal_voltage_bound: float = -1, nad_parameters: NadParameters = None, sld_parameters: SldParameters = None)
```

- vl_id: the starting VL to display. If None, display the first VL from network.get_voltage_levels()
- depth: the diagram depth around the voltage level, controls the size of the sub network. In the SLD tab will be always displayed one diagram, from the VL list currently selected item.
- low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
- high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
- nad_parameters: layout properties to adjust the svg rendering for the NAD
- sld_parameters: layout properties to adjust the svg rendering for the SLD
