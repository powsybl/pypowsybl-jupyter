# pypowsybl-jupyter

Widgets for [pypowsybl](https://github.com/powsybl/pypowsybl) in the Jupyter notebook.


## Installation

You can install using `pip`:

```bash
pip install pypowsybl_jupyter
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] pypowsybl_jupyter
```

## Examples

In the examples directory there are some examples of how widgets can be used.


## Development Installation

Create a dev environment:
```bash
conda create -n pypowsybl_jupyter-dev -c conda-forge nodejs=18 yarn=1 python=3.11 jupyterlab=3.6.6
conda activate pypowsybl_jupyter-dev
```

Please note that the build could fail with different versions of yarn, python and jupyterlab.


Install the python. This will also build the TS package.
```bash
pip install -e ".[test]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For lab, this is done by the command:

```
jupyter labextension develop --overwrite .
yarn run build
```

For classic notebook, you need to run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py pypowsybl_jupyter
jupyter nbextension enable --sys-prefix --py pypowsybl_jupyter
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
yarn run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.
