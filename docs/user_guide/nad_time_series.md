# NAD time series widget

NAD (Network Area Diagram) Time Series is an interactive network explorer widget with temporal visualization capabilities, built on pypowsybl-jupyter's NAD widget and standard ipywidgets. This widget extends the basic NAD explorer by adding time series data visualization for network branches.

Through the widget, you can select multiple voltage levels from the list (or search for a specific one using the Filter), navigate through time using a time slider, and visualize how branch states evolve over time. The NAD diagram displays the selected voltage levels with real-time updates of branch values and connection states.

The following code, to be run in a notebook, first creates a network with time series data, then displays the NAD time series explorer on it.

```python
import pypowsybl.network as pn
import pandas as pd
from pypowsybl_jupyter import nad_time_series

# Create a network
network = pn.create_ieee118()

# Prepare time series data
time_series_data = pd.DataFrame({
    'timestamp': ['2024-01-01 00:00', '2024-01-01 01:00', '2024-01-01 02:00'],
    'branch_id': ['L1-2-1', 'L1-2-1', 'L1-2-1'],
    'value1': [150.5, 165.2, 140.8],
    'value2': [148.3, 162.1, 138.9],
    'connected1': [True, True, True],
    'connected2': [True, True, False]
})

nad_time_series(network, time_series_data=time_series_data)
```

A 'depth' slider controls the size of the sub network, while a 'time' slider allows navigation through different timestamps in the time series data.
Pan and zoom features are available for the diagram.


## Key Features

- Temporal Navigation: Navigate through time using the time slider to see how network conditions evolve
- Real-time Branch Updates: Branch states (values, connections) update automatically as you move through time
- Interactive Filtering: Filter and select voltage levels using the search functionality
- Customizable Depth: Control the network diagram scope with the depth slider
- Dynamic Visualization: Branch states are visualized with real-time updates based on time series data

## Time Series Data Format
The time_series_data DataFrame must contain the following columns:

- timestamp: Time points for the data 
- branch_id: Identifier for the network branch
- value1: branch side 1 float value 
- value2: branch side 2 float value 
- connected1: Boolean indicating if side 1 is connected
- connected2: Boolean indicating if side 2 is connected
## Widget API

Other than the target network, the NAD Time Series widget can be customized using additional parameters:

```python
nad_time_series(network: Network, 
               voltage_level_ids: list = None, 
               depth: int = 1,
               time_series_data: pd.DataFrame = None,
               low_nominal_voltage_bound: float = -1, 
               high_nominal_voltage_bound: float = -1, 
               parameters: NadParameters = None
)
```
## Parameters

- network: The input network (required)
- voltage_level_ids: The starting list of voltage levels to display. None displays all the network's voltage levels
- depth: The diagram depth around the voltage level, controls the size of the sub network (default: 1)
- time_series_data: A DataFrame containing time series data for the network (required). Must contain columns: 'timestamp', 'branch_id', 'value1', 'value2', 'connected1', 'connected2'
- low_nominal_voltage_bound: Low bound to filter voltage levels according to nominal voltage (default: -1, no filtering)
- high_nominal_voltage_bound: High bound to filter voltage levels according to nominal voltage (default: -1, no filtering)
- parameters: Layout properties to adjust the SVG rendering for the NAD (NadParameters object)
