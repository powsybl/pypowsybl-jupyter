# pypowsybl-jupyter

Widgets for [PyPowSyBl](https://github.com/powsybl/pypowsybl) in [Jupyter](https://jupyter.org) notebooks.

Pypowsybl-jupyter integrates the [powsybl-diagram-viewer](https://github.com/powsybl/powsybl-diagram-viewer) library to display diagrams and is built on [anywidget](https://github.com/manzt/anywidget/), an abstraction around the [Jupyter Widget](https://github.com/jupyter-widgets/ipywidgets) framework.

The widgets should work with versions of Jupyter Lab >= 4, Notebook >= 7.

## Installation

You can install the widgets binaries using `pip`:

```bash
pip install pypowsybl_jupyter
```

## Examples

In the examples directory there are some notebooks demonstrating the widgets.


## Development installation

Create a virtual environment and install pypowsybl_jupyter in *editable* mode with the optional development dependencies:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

For example, in editable mode you can watch the source directory for changes, to automatically rebuild the widget, and run JupyterLab in different terminals. Changes made in `js/` will be reflected in an open notebook where the widget is used.

Please note that pip only supports editable installs (enabled with the option -e) from a pyproject.toml files since v21.3. Make sure you have an up-to-date version of pip
```sh
pip install --upgrade pip
```


```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
npm run dev
# Run JupyterLab in another terminal.
# Please ensure that you also activate the virtual environment in the new terminal.
source .venv/bin/activate
jupyter lab
```

To enable the automatic reloading in Jupyter, please define this environment variable:

```py
%env ANYWIDGET_HMR=1
```
or, before launching a Jupyter session:

```bash
ANYWIDGET_HMR=1 jupyter lab
```

The changes should take effect after saving a source file. In case a change is not recognized, restarting the notebook kernel may help.

## Packaging for distribution

To package pypowsybl_jupyter in a .whl file, for distribution:
```bash
pip install build
python -m build --wheel
```

The 'created .whl file' will be available in the 'dist' directory. To install the .whl file:
```bash
pip install <'created .whl file'>
```

## Notes

Jupyter Widgets require Javascript extension code that Jupyter Lab needs to locate upon kernel startup.

In a standalone Jupyter Lab setup, the widget package is usually deployed in the same environment, allowing Jupyter Lab to find and load the necessary JS code seamlessly (e.g., if you **pip install pypowsybl_jupyter** in your standalone environment, then start Jupyter Lab, the extension is activated and anywidget and Jupyter Widget are listed among the installed dependencies).

However, installing Jupyter Widgets in kernels that are spawned by more controlled environment like [Mybinder](https://mybinder.org/), doesn't apparently let Jupyter Lab find the JS extension code, causing widgets to fail to display properly (e.g., in these cases, if you **pip install pypowsybl_jupyter** from inside a notebook a javascript error could appear in the widget's cell, with a message similar to *"Failed to load view class 'AnyView' from module 'anywidget'"*, despite the fact that no errors are shown during the installation nor that anywidget and Jupyter widget are still listed among the installed dependencies).

To resolve this known limitation, widget packages need to be installed in such a way that they are available to the hosting environment. In the Mybinder case it seems to be sufficient to add an **anywidget** entry to the project's **requirements.txt** file, which is used by Mybinder's infrastructure to instantiate Jupyter Lab. Once anywidget is installed succesfully, any custom widget developed using anywidget, like pypowsybl_jupyter's widgets, can be installed and manged correctly from a notebook (i.e., running **pip install pypowsybl_jupyter** in a notebook should work correctly).
