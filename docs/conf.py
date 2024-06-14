# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import datetime
import os
import sys
import toml

# Path to python sources, for doc generation on readthedocs
source_path = os.path.abspath('..')
sys.path.insert(0, source_path)
print(f'appended {source_path}')


# -- Project information -----------------------------------------------------

project = 'pypowsybl-jupyter'
github_repository = "https://github.com/powsybl/pypowsybl-jupyter/"
copyright_year = f'{2024}' if datetime.datetime.now().year == 2024 else f'2024-{datetime.datetime.now().year}'

# Find the release information.
# We have a single source of truth for our version number: the project's pyproject.toml file.
def extract_version_from_toml_file(file_path):
    release = version = 'dev'
    try:
        # Load the pyproject.toml file
        with open(file_path, 'r') as file:
            pyproject_data = toml.load(file)
        
        # Access the version attribute
        read_version = pyproject_data.get('project', {}).get('version', None)
        
        if read_version is not None:
            release = read_version
             # The short X.Y version.
            version = ".".join(release.split(".")[:2])
        else:
            print(f"The 'version' attribute is not found in {file_path}.")

    except FileNotFoundError:
        print(f"The file {file_path} does not exist.")
    except Exception as e:
        print(f"An error occurred: {e}")
    
    return (release, version)

file_with_version = os.path.join(source_path, "pyproject.toml")
(release, version) = extract_version_from_toml_file(file_with_version)

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ['sphinx.ext.autodoc',
              'sphinx.ext.autosummary',
              'sphinx.ext.viewcode',
              'sphinx.ext.doctest',
              'sphinx.ext.napoleon',
              'sphinx.ext.todo',
              'sphinx.ext.intersphinx',
              'sphinx_tabs.tabs',
              'myst_parser',
              # Extension used to add a "copy" button on code blocks
              'sphinx_copybutton'
              ]
myst_enable_extensions = [
    "amsmath",
    "colon_fence",
    "dollarmath",
    "attrs_inline"
]
myst_heading_anchors = 6

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "furo"

html_title = f"{project} v{release}"

html_short_title = 'pypowsybl-jupyter'

html_logo = '_static/logos/logo_lfe_powsybl.svg'
html_favicon = "_static/favicon.ico"

html_context = {
    "sidebar_logo_href": "https://powsybl.readthedocs.org",
    "copyright_year": copyright_year,
    "github_repository": github_repository
}

html_theme_options = {
    # the following 3 lines enable edit button
    "source_repository": github_repository,
    "source_branch": "main",
    "source_directory": "docs/",
}

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']
html_css_files = ['styles/styles.css']

todo_include_todos = True

# Links to external documentations : python 3 and pandas
intersphinx_mapping = {
}
intersphinx_disabled_reftypes = ["*"]

# Generate one file per method
autosummary_generate = True
