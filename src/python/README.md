# Python
This directory contains Python code that will be used as glue between the NodeJS validation engine and server,
and a Python framework such as [Luigi](http://luigi.readthedocs.io) or
[bigmetadata](https://github.com/CartoDB/bigmetadata).

Python libraries are installed into a Python virtual environment to avoid library conflicts with libraries
already installed on the hardware.

This code currently assumes Python 3.6 (required by the Python **venv** tool).

To set up a virtual environment in the same way as my development environment do the following in the same
directory as this README.md file. (See this
[link](https://packaging.python.org/installing/#creating-virtual-environments)
for the instructions I used to set things up on a Mac. Modify appropriately for other platforms.)

1. Run **python3 -m venv virtualEnvironment**. (You could use a directory name other than _virtualEnvironment_
 and a path outside the source area if you wish but that's what I used.)
2. Run **source virtualEnvironment/bin/activate**.
3. Run **pip install -r requirements.txt** to install Luigi and it's dependencies into the virtual environment.


<sub><sup>For future reference to create the **requirements.txt** file simply run **pip freeze >requirements.txt**.</sup></sub> 
