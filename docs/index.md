```{toctree}
---
caption: Contents of this website
maxdepth: 2
hidden: true
---

```

# pypowsybl-jupyter
Widgets for [pypowsybl](https://github.com/powsybl/pypowsybl) in [Jupyter](https://jupyter.org) notebooks. 

Pypowsybl-jupyter integrates the [powsybl-diagram-viewer](https://github.com/powsybl/powsybl-diagram-viewer) library and is built on [anywidget](https://github.com/manzt/anywidget/).

## Getting started

### Installation

You can easily install released versions of pypowsybl-jupyter from
[PyPI](https://pypi.org/project/pypowsybl-jupyter/) using pip:


```bash
pip install pypowsybl_jupyter
```

Note: restarting jupyter-lab could be needed in order for the widgets to be correctly registered.

If you want to build pypowsybl-jupyter from its sources, please check out the detailed build instructions on [github](https://github.com/powsybl/pypowsybl-jupyter).

### Basic usage: network explorer

The following code, to be run in a notebook, displays an interactive network explorer widget. 

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import network_explorer

network=pn.create_four_substations_node_breaker_network()

network_explorer(network)
```

You can select a voltage level from the list (or search of a specific one using the Filter) and the NAD and SLD diagrams for that voltage level will be displayed in the two "Network Area" and "Single Line" tabs, respectively. Both diagrams can be panned and zoomed.

####  Network Area tab

The selected voltage level is the displayed NAD's center. 

![network-explorer  NAD tab](/_static/img/network_explorer_1.png)

A 'depth' slider controls the size of the sub network.

#### Single Line tab

![network-explorer SLD tab](/_static/img/network_explorer_2.png)

By clicking on an arrow in the SLD you can navigate to another voltage level. 

Switches can also be clicked, causing their status in the network to change; Please note that, currently, this action does not trigger any computation on the network  (e.g., a LF is not   automatically run on the network).


## User guide

