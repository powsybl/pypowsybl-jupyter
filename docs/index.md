```{toctree}
---
caption: Contents of this website
maxdepth: 2
hidden: true
---

user_guide/index.md
```

# pypowsybl-jupyter
Widgets for [PyPowSyBl](https://github.com/powsybl/pypowsybl) in [Jupyter](https://jupyter.org) notebooks. 

Pypowsybl-jupyter integrates the [powsybl-diagram-viewer](https://github.com/powsybl/powsybl-diagram-viewer) library to display diagrams and is built on [anywidget](https://github.com/manzt/anywidget/) and [ipywidgets](https://ipywidgets.readthedocs.io/en/stable/index.html)

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

Paste this code into a Jupyter notebook, to display an interactive network explorer widget. 

```python
import pypowsybl.network as pn
from pypowsybl_jupyter import network_explorer

network=pn.create_ieee9()

network_explorer(network)
```

Through the network explorer widget you can display NAD and SLD diagrams for a voltage level, selected from the available network's voltage levels, in two dedicated tabs.


## Going further

For more details on pypowsybl-jupyter, please check out the [user guide](user_guide/index.md).

In the [examples](https://github.com/powsybl/pypowsybl-jupyter/tree/main/examples) directory there are some notebooks demonstrating the widgets.