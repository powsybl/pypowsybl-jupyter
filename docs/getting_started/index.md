# Getting started

## Installation

You can easily install released versions of pypowsybl-jupyter from
[PyPI](https://pypi.org/project/pypowsybl-jupyter/) using pip:


```bash
pip install pypowsybl_jupyter
```

Note: restarting jupyter-lab could be needed in order for the widgets to be correctly registered.

If you want to build pypowsybl-jupyter from its sources, please check out the detailed build instructions on [github](https://github.com/powsybl/pypowsybl-jupyter).

## Basic usage: network explorer

Paste this code into a Jupyter notebook, to display an interactive network explorer widget. 

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import network_explorer

network=pn.create_ieee9()

network_explorer(network)
```

Through the network explorer widget you can display NAD and SLD diagrams for a voltage level, selected from the available network's voltage levels, in two dedicated tabs.

![getting started demo](/_static/img/getting_started_1.png)


## Going further

In the [examples](https://github.com/powsybl/pypowsybl-jupyter/tree/main/examples) directory you can find some notebooks demonstrating the widgets.

For more details on pypowsybl-jupyter's widgets, please check out the [User guide](../user_guide/index.md).

