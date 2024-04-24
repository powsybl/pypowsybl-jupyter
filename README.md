# pypowsybl-jupyter

Widgets for [pypowsybl](https://github.com/powsybl/pypowsybl) in the Jupyter notebook.

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
