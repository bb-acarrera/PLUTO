#GDAL pyhton pacakges are part of the gdal install, for Ubuntu:
#```shell
#sudo add-apt-repository -y ppa:ubuntugis/ubuntugis-stable
#sudo apt update 
#sudo apt install gdal-bin python-gdal python3-gdal
#```

import os
from osgeo import ogr

daShapefile = r"world_borders"

driver = ogr.GetDriverByName('ESRI Shapefile')

dataSource = driver.Open(daShapefile, 0) # 0 means read-only. 1 means writeable.

# Check to see if shapefile is found.
if dataSource is None:
    print 'Could not open %s' % (daShapefile)
else:
    print 'Opened %s' % (daShapefile)
    layer = dataSource.GetLayer()
    featureCount = layer.GetFeatureCount()
    print "Number of features in %s: %d" % (os.path.basename(daShapefile),featureCount)