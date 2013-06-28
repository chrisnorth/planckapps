import numpy as np
import wx ##wxPython
#import pyfits as fits ##pyfits now part of astropy
from astropy.io import fits

import matplotlib
matplotlib.interactive(False)
matplotlib.use('WXAgg')
from matplotlib.backends.backend_wxagg import FigureCanvasWxAgg
from matplotlib.figure import Figure
from matplotlib.pyplot import gcf, setp


amp = np.zeros(8,'f')

class Knob:
    def setKnob(self, value):
        pass


class Param:
    global amp
    def __init__(self, initialValue=None, minimum=0., maximum=10., id=0):
        self.minimum = minimum
        self.maximum = maximum
        self.id = id
        if initialValue != self.constrain(initialValue):
            raise ValueError('illegal initial value')
        amp[id] = initialValue
        self.knobs = []
        
    def attach(self, knob):
        self.knobs += [knob]
        
    def set(self, value, knob=None):
#        self.value = value
        amp[self.id] = self.constrain(value)
        for feedbackKnob in self.knobs:
            if feedbackKnob != knob:
                feedbackKnob.setKnob(amp[self.id])
        return amp[self.id]

    def constrain(self, value):
        if value <= self.minimum:
            value = self.minimum
        if value >= self.maximum:
            value = self.maximum
        return value





class ScaleSlider(Knob):
    def __init__(self, parent, label, parm):
        self.parent = parent
        self.sliderLabel = wx.StaticText(parent, label=label)
        self.slider = wx.Slider(parent, -1, style=wx.SL_VERTICAL)
        self.slider.SetMax(10)
        self.setKnob(amp[parm.id])
        
        sizer = wx.BoxSizer(wx.VERTICAL)
        sizer.Add(self.slider, -1, wx.EXPAND)
        sizer.Add(self.sliderLabel, 0, wx.EXPAND | wx.ALIGN_CENTER | wx.ALL, border=1)
        self.sizer = sizer
        self.slider.Bind(wx.EVT_SLIDER, self.sliderHandler)

        self.parm = parm
        self.parm.attach(self)
          
    def sliderHandler(self, evt):
        value = evt.GetInt()
        self.parm.set(value)
        self.parent.cmbWindow.draw()
                
    def setKnob(self, value):
        self.slider.SetValue(value)




class GraphicEqualizer():
    def __init__(self,parent):
        self.slider1 = ScaleSlider(parent,u"8\u00B0",parm=parent.cmbWindow.A0)
        self.slider2 = ScaleSlider(parent,u"4\u00B0",parm=parent.cmbWindow.A1)
        self.slider3 = ScaleSlider(parent,u"2\u00B0",parm=parent.cmbWindow.A2)
        self.slider4 = ScaleSlider(parent,u"1\u00B0",parm=parent.cmbWindow.A3)
        self.slider5 = ScaleSlider(parent,"30'",parm=parent.cmbWindow.A4)
        self.slider6 = ScaleSlider(parent,"15'",parm=parent.cmbWindow.A5)
        self.slider7 = ScaleSlider(parent,"8'",parm=parent.cmbWindow.A6)
        self.slider8 = ScaleSlider(parent,"4'",parm=parent.cmbWindow.A7)
        
        sizer = wx.BoxSizer(wx.HORIZONTAL)
        sizer.Add(self.slider1.sizer,1,wx.EXPAND)
        sizer.Add(self.slider2.sizer,1,wx.EXPAND)
        sizer.Add(self.slider3.sizer,1,wx.EXPAND)
        sizer.Add(self.slider4.sizer,1,wx.EXPAND)
        sizer.Add(self.slider5.sizer,1,wx.EXPAND)
        sizer.Add(self.slider6.sizer,1,wx.EXPAND)
        sizer.Add(self.slider7.sizer,1,wx.EXPAND)
        sizer.Add(self.slider8.sizer,1,wx.EXPAND)
        self.sizer = sizer


class CMBDemoFrame(wx.Frame):
    def __init__(self, *args, **kwargs):
        wx.Frame.__init__(self, *args, **kwargs)
        
        self.cmbWindow  = CMBWindow(self)
        self.graphEqual = GraphicEqualizer(self)

        sizer = wx.BoxSizer(wx.HORIZONTAL)
        sizer.Add(self.graphEqual.sizer,0, wx.EXPAND | wx.ALIGN_CENTER | wx.ALL, border=5)
        sizer.Add(self.cmbWindow,0, wx.EXPAND | wx.ALIGN_CENTER | wx.ALL, border=5)


        self.SetSizer(sizer)

class CMBWindow(wx.Window, Knob):
    def __init__(self, *args, **kwargs):
        wx.Window.__init__(self, *args, **kwargs)

        hdu = fits.open('cmb_maps.fits')
#        hdu = fits.open('einstein_pack.fits')
#        hdu = fits.open('planck-satellite_pack.fits')
        self.sky = np.transpose(hdu[0].data)
        hdu.close()

        self.A0 = Param(10., minimum=0., maximum=10., id=0)
        self.A1 = Param(10., minimum=0., maximum=10., id=1)
        self.A2 = Param(10., minimum=0., maximum=10., id=2)
        self.A3 = Param(10., minimum=0., maximum=10., id=3)
        self.A4 = Param(10., minimum=0., maximum=10., id=4)
        self.A5 = Param(10., minimum=0., maximum=10., id=5)
        self.A6 = Param(10., minimum=0., maximum=10., id=6)
        self.A7 = Param(10., minimum=0., maximum=10., id=7)
        self.figure = Figure()
        self.canvas = FigureCanvasWxAgg(self, -1, self.figure)
        self.draw()

        self.A0.attach(self)
        self.A1.attach(self)
        self.A2.attach(self)
        self.A3.attach(self)
        self.A4.attach(self)
        self.A5.attach(self)
        self.A6.attach(self)
        self.A7.attach(self)
        self.Bind(wx.EVT_SIZE, self.sizeHandler)


    def sizeHandler(self, *args, **kwargs):
        self.canvas.SetSize(self.GetSize())
        

    def draw(self):

#        print 'draw'

        if not hasattr(self, 'subplot1'):
            self.subplot1 = self.figure.add_subplot(111)

        sky  = np.sum((10-amp)*self.sky,axis=2)/2. 

        ims = self.subplot1.imshow(sky,vmin=-100,vmax=100)
#        ims.set_cmap('gray')

    def repaint(self):
        self.canvas.draw()

    def setKnob(self, value):
        self.repaint()



class App(wx.App):
    def OnInit(self):
        self.frame1 = CMBDemoFrame(parent=None, title="CMB power spectrum", size=(1024, 480))
        self.frame1.Show()
        return True
        
app = App()
app.MainLoop()
