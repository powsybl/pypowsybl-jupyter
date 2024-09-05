# NAD explorer widget

NAD (Network Area Diagram) explorer is interactive network explorer widget, built on pypowsybl-jupyter's NAD widget and some standard [ipywidgets](https://ipywidgets.readthedocs.io/en/stable/index.html): select lists, tabs, etc.

Through the widget, you can select multiple voltage levels from the list (or search of a specific one using the Filter) and the NAD diagram for those voltage levels will be displayed.

The following code, to be run in a notebook, first creates a network, then displays the NAD explorer on it.

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import nad_explorer

network=pn.pn.create_ieee57()

nad_explorer(network)
```

![nad-explorer](/_static/img/nad_explorer.png)

A 'depth' slider controls the size of the sub network.
Pan and zoom features are available for the diagram.


## Widget API

Other than the target network, the NAD explorer can be customized using additional parameters:

```python
nad_explorer(network: Network, voltage_level_ids : list = None, depth: int = 1, low_nominal_voltage_bound: float = -1, high_nominal_voltage_bound: float = -1, parameters: NadParameters = None):
```

- network: the input network
- voltage_level_ids: the starting list of VL to display. None displays all the network's VLs
- depth: the diagram depth around the voltage level, controls the size of the sub network
- low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
- high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
- parameters: layout properties to adjust the svg rendering for the nad
