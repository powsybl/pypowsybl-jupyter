# pypowsybl-jupyter

Widgets for [pypowsybl](https://github.com/powsybl/pypowsybl) in the Jupyter notebook.


## Installation

An existing python and jupyter-lab environment is assumed (the "installation from sources" section describes how to create a new environment from scratch, using conda).

You can install the widget binaries using `pip`:

```bash
pip install pypowsybl_jupyter
```

## Examples

In the examples directory there are some notebooks demonstrating the widgets.


## Installation from sources

Create a dev environment:
```bash
conda create -n pypowsybl_jupyter-dev -c conda-forge nodejs python jupyterlab
conda activate pypowsybl_jupyter-dev
```

Build, package and install pypowsybl_jupyter (python and typescript code). 
```bash
pip install .
```

## Development Installation

Create a dev environment:
```bash
conda create -n pypowsybl_jupyter-dev -c conda-forge nodejs python jupyterlab
conda activate pypowsybl_jupyter-dev
```

Build, package and install pypowsybl_jupyter (python and typescript code): 

```bash
pip install -e .
```

The "-e" flag sets the installation in development mode, enabling real-time editing and updates a running application. For example, if you use JupyterLab you can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
npm run dev
# Run JupyterLab in another terminal
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

The changes should take effect after saving the source file. If the changes are not recognized, restarting the notebook kernel may help.

## Packaging for distribution

To package pypowsybl-jupyter in a .whl file, for distribution:
```bash
conda activate pypowsybl_jupyter-dev
pip install build
python -m build --wheel
```

The 'created .whl file' will be available in the 'dist' directory. To install the .whl file:
```bash
pip install <'created .whl file'>
```
