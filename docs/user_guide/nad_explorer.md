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

## Time Series Visualization

Optionally, the parameter `time_series_data` enables visualizing how branch states evolve over time via an interactive slider. 
The following code, to be executed in a notebook, demonstrates this feature:

```python
import pypowsybl.network as pn
import pandas as pd
from pypowsybl_jupyter import nad_explorer

# Create a network
network = pn.create_ieee118()

# Prepare time series data (the branch_id of this example concerns only the voltage level "VL1")
time_series_data = pd.DataFrame({
    'timestamp': ['2024-01-01 00:00', '2024-01-01 01:00', '2024-01-01 02:00'],
    'branch_id': ['L1-2-1', 'L1-2-1', 'L1-2-1'],
    'value1': [150.5, 165.2, 140.8],
    'value2': [148.3, 162.1, 138.9],
    'connected1': [True, True, True],
    'connected2': [True, True, False]
})

# Display the diagram with time series data, showing only the voltage level "VL1"
nad_explorer(network, voltage_level_ids=["VL1"], time_series_data=time_series_data)
```
The branch states (values, connections) are updated automatically in the NAD, as you move the time slider.

The time_series_data DataFrame must contain the following columns:
- timestamp: Time points for the data 
- branch_id: Identifier for the network branch
- value1: branch side 1 float value 
- value2: branch side 2 float value 
- connected1: Boolean indicating if side 1 is connected
- connected2: Boolean indicating if side 2 is connected


## Widget API

Other than the target network, the NAD explorer can be customized using additional parameters:

```python
nad_explorer(network: Network, voltage_level_ids : list = None, depth: int = 1, time_series_data: pd.DataFrame = None, low_nominal_voltage_bound: float = -1, high_nominal_voltage_bound: float = -1, parameters: NadParameters = None, fixed_nad_positions: DataFrame = None):
```

- network: the input network
- voltage_level_ids: the starting list of VL to display. None displays all the network's VLs
- depth: the diagram depth around the voltage level, controls the size of the sub network
- time_series_data: a DataFrame containing time series data for the network.
- low_nominal_voltage_bound: low bound to filter voltage level according to nominal voltage
- high_nominal_voltage_bound: high bound to filter voltage level according to nominal voltage
- parameters: layout properties to adjust the svg rendering for the nad
- fixed_nad_positions: positions dataframe to layout the voltage levels in the diagram. The fixed positions dataframe is fully described in [Pypowsybl Network area diagram documentation](https://powsybl.readthedocs.io/projects/pypowsybl/en/stable/user_guide/network_visualization.html#network-area-diagram). 

