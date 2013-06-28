from numpy import *
##import pyfits as fits ##pyfits now part of astropy
from astropy.io import fits
import sys

prefix = sys.argv[1]

maps = zeros((8,500,500),'f')

for i in arange(8):
    map_name = "%s%i.fits" % (prefix,i)
    print i, map_name, 
    hdu = fits.open(map_name)
    dat = hdu[0].data
    print dat.shape
    
    maps[i,:,:] = dat
    
    hdu.close()


hdu = fits.PrimaryHDU(maps)
hdu.writeto('%ss.fits' % prefix)
