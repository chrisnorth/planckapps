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


#amp = np.zeros(8,'f')

class Knob:
    def setKnob(self, value):
        pass


class Param:
#    global amp
    def __init__(self, initialValue=None, minimum=0., maximum=10., amp=np.zeros(8,'f'), id=0):
        self.minimum = minimum
        self.maximum = maximum
        self.amp = amp
        self.id = id
        if initialValue != self.constrain(initialValue):
            raise ValueError('illegal initial value')
        self.amp[id] = initialValue
        self.knobs = []
        
    def attach(self, knob):
        self.knobs += [knob]
        
    def set(self, value, knob=None):
        self.amp[self.id] = self.constrain(value)
        for feedbackKnob in self.knobs:
            if feedbackKnob != knob:
                feedbackKnob.setKnob(self.amp[self.id])
        return self.amp[self.id]

    def constrain(self, value):
        if value <= self.minimum:
            value = self.minimum
        if value >= self.maximum:
            value = self.maximum
        return value



class ScaleSlider(Knob):
    def __init__(self, parent, label, parm, tooltip=""):
        self.parent = parent
        self.sliderLabel = wx.StaticText(parent, label=label)
        self.sliderLabel.SetToolTip(wx.ToolTip(tooltip))
        self.slider = wx.Slider(parent, -1, style=wx.SL_VERTICAL, size=(15,150))
        self.slider.SetMax(10)
        self.setKnob(parm.amp[parm.id])
        
        sizer = wx.BoxSizer(wx.VERTICAL)
        sizer.Add(self.slider, -1, wx.EXPAND)
        sizer.Add(self.sliderLabel, 0, wx.ALIGN_CENTER | wx.ALL, border=1)
        self.sizer = sizer
        self.slider.SetPageSize(1)
        self.slider.Bind(wx.EVT_SCROLL, self.sliderHandler)

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
        self.slider = []
        self.slider.append(ScaleSlider(parent,u"8\u00B0",parm=parent.cmbWindow.A0,tooltip="Fist at arm's length"))
        self.slider.append(ScaleSlider(parent,u"4\u00B0",parm=parent.cmbWindow.A1,tooltip="Palm at arm's length"))
        self.slider.append(ScaleSlider(parent,u"2\u00B0",parm=parent.cmbWindow.A2,tooltip="Two fingers at arm's length"))
        self.slider.append(ScaleSlider(parent,u"1\u00B0",parm=parent.cmbWindow.A3,tooltip="A finger at arm's length"))
        self.slider.append(ScaleSlider(parent,"30'",parm=parent.cmbWindow.A4,tooltip="Size of Moon"))
        self.slider.append(ScaleSlider(parent,"15'",parm=parent.cmbWindow.A5,tooltip="Size of half Moon"))
        self.slider.append(ScaleSlider(parent,"8'",parm=parent.cmbWindow.A6,tooltip="Match head at arm's length"))
        self.slider.append(ScaleSlider(parent,"4'",parm=parent.cmbWindow.A7,tooltip="Matchstick width at arm's length"))
        
        sizer = wx.BoxSizer(wx.HORIZONTAL)

        for id in np.arange(8):
            sizer.Add(self.slider[id].sizer,1,wx.EXPAND)
        self.sizer = sizer

    def set_amps(self,amps):
        for id in np.arange(8):
 #         print id,amps[id]
            self.slider[id].setKnob(amps[id])
            self.slider[id].parm.set(amps[id])
            

class Controls():
    def __init__(self,parent):

        sizer = wx.BoxSizer(wx.VERTICAL)
        self.parent = parent
        self.parent.SetBackgroundColour('Gold')
        font = wx.Font(28, wx.DEFAULT, wx.NORMAL, wx.NORMAL, False, 'Ubuntu')
        font3 = wx.Font(12, wx.DEFAULT, wx.NORMAL, wx.NORMAL, False, 'Ubuntu')
        
        bp = wx.Panel(parent)
        bp.SetBackgroundColour('Cyan')
        bpheading = wx.StaticText(bp, label='Input images', pos=(5,10))
        bpheading.SetFont(font)
        bpheading.SetForegroundColour('White')
        self.rb1 = wx.RadioButton(bp, label='Cloudy noise', pos=(10, 60), 
            style=wx.RB_GROUP)
        self.rb1.SetToolTip(wx.ToolTip('Fractral noise with same power on different angles'))

        self.rb2 = wx.RadioButton(bp, label='Planck CMB', pos=(10, 80))
        self.rb2.SetToolTip(wx.ToolTip('Fossil radiation from Big Bang'))

#        self.rb3 = wx.RadioButton(bp, label='Planck dust', pos=(10, 50))

        self.rb4 = wx.RadioButton(bp, label='Einstein', pos=(10, 120))
        self.rb4.SetToolTip(wx.ToolTip('Picture of Einstien projected on sky'))

        self.rb5 = wx.RadioButton(bp, label='Planck', pos=(10, 140))
        self.rb5.SetToolTip(wx.ToolTip('Picture of the Planck satelite'))

        self.rb6 = wx.RadioButton(bp, label='British Isles', pos=(10, 100))
        self.rb6.SetToolTip(wx.ToolTip("Isles on sky with same angular extent as on Earth's surface"))
        self.button_panel = bp
        
        self.rb1.Bind(wx.EVT_RADIOBUTTON, self.get_image)
        self.rb2.Bind(wx.EVT_RADIOBUTTON, self.get_image)
#        self.rb3.Bind(wx.EVT_RADIOBUTTON, self.get_image)
        self.rb4.Bind(wx.EVT_RADIOBUTTON, self.get_image)
        self.rb5.Bind(wx.EVT_RADIOBUTTON, self.get_image)
        self.rb6.Bind(wx.EVT_RADIOBUTTON, self.get_image)

        cp = wx.Panel(parent)
        cp.SetBackgroundColour('Green')
        bpheading = wx.StaticText(cp, label='Colour table', pos=(5,10))
        bpheading.SetFont(font)
        bpheading.SetForegroundColour('White')
        self.cb1 = wx.RadioButton(cp, label='gray', pos=(10, 60), 
            style=wx.RB_GROUP)
        self.cb1.SetToolTip(wx.ToolTip("Normal linear black to white"))

        self.cb2 = wx.RadioButton(cp, label='hot', pos=(10, 80))
        self.cb2.SetToolTip(wx.ToolTip("Temperature scale: through red-hot to white"))

        self.cb3 = wx.RadioButton(cp, label='Blues', pos=(10, 100))
        self.cb3.SetToolTip(wx.ToolTip("Negative scale in blue"))

        self.cb4 = wx.RadioButton(cp, label='jet', pos=(10, 120))
        self.cb4.SetToolTip(wx.ToolTip("Blue cold to red hot"))
        self.cmap_panel = cp

        self.cb1.Bind(wx.EVT_RADIOBUTTON, parent.cmbWindow.get_cmap)
        self.cb2.Bind(wx.EVT_RADIOBUTTON, parent.cmbWindow.get_cmap)
        self.cb3.Bind(wx.EVT_RADIOBUTTON, parent.cmbWindow.get_cmap)
        self.cb4.Bind(wx.EVT_RADIOBUTTON, parent.cmbWindow.get_cmap)


        font2 = wx.Font(22, wx.DEFAULT, wx.NORMAL, wx.NORMAL, False, 'Ubuntu')
        ge = wx.Panel(parent)
        ge.SetBackgroundColour('Gold')
        geheading = wx.StaticText(ge, label='Graphic Equalizer',pos=(5,10))
        geheading.SetFont(font2)
        geheading.SetForegroundColour('White')


        self.graphEqual = GraphicEqualizer(parent)
 
        pp = wx.Panel(parent)
        pp.SetBackgroundColour('Orange')
        bpheading = wx.StaticText(pp, label='Presets', pos=(5,10)) 
        bpheading.SetFont(font)
        bpheading.SetForegroundColour('White')

        self.cp1 = wx.RadioButton(pp, label='zero', pos=(10, 60), 
            style=wx.RB_GROUP)
        self.cp1.SetToolTip(wx.ToolTip("Everything off"))

        self.cp2 = wx.RadioButton(pp, label='unity', pos=(10, 80))
        self.cp2.SetToolTip(wx.ToolTip("Everything to one"))

        self.cp3 = wx.RadioButton(pp, label='low-pass', pos=(10, 100))
        self.cp3.SetToolTip(wx.ToolTip("Reduce small angular stuff"))

        self.cp4 = wx.RadioButton(pp, label='high-pass', pos=(10, 120))
        self.cp4.SetToolTip(wx.ToolTip("Reduce large angular stuff"))

        self.cp5 = wx.RadioButton(pp, label='COBE', pos=(10, 140))
        self.cp5.SetToolTip(wx.ToolTip("Effect of 7 degree resolution."))

        self.cp6 = wx.RadioButton(pp, label='WMAP', pos=(10, 160))
        self.cp6.SetToolTip(wx.ToolTip("Effect of 0.3 degree resolution."))
        self.presets_panel = pp

        self.cp1.Bind(wx.EVT_RADIOBUTTON, self.set_amps)
        self.cp2.Bind(wx.EVT_RADIOBUTTON, self.set_amps)
        self.cp3.Bind(wx.EVT_RADIOBUTTON, self.set_amps)
        self.cp4.Bind(wx.EVT_RADIOBUTTON, self.set_amps)
        self.cp5.Bind(wx.EVT_RADIOBUTTON, self.set_amps)
        self.cp6.Bind(wx.EVT_RADIOBUTTON, self.set_amps)

        sizer.Add(self.button_panel,1, wx.EXPAND)
        sizer.Add(self.cmap_panel,1, wx.EXPAND)
        sizer.Add(ge,0, wx.EXPAND)
        sizer.Add(self.graphEqual.sizer,1, wx.EXPAND )
        sizer.Add(self.presets_panel,2, wx.EXPAND)

        self.sizer = sizer

    def get_image(self, e):
        btn = e.GetEventObject()
        label = btn.GetLabel()
        
        self.parent.cmbWindow2.get_image(label)
        self.parent.cmbWindow.get_image(label)

    def set_amps(self, e):
        btn = e.GetEventObject()
        preset = btn.GetLabel()

        if preset=="unity":
            amps = np.ones(8)*5.
        elif preset=="zero":
            amps = np.ones(8)*10.
        elif preset=="zero":
            amps = np.ones(8)*10 
        elif preset=="low-pass":
            amps = np.arange(8) + 2
        elif preset=="high-pass":
            amps = 10-np.arange(8)
        elif preset=="COBE":
            l = 16*2**np.arange(8)
            amps = 10-np.exp(-l*l*(7*np.pi/180.)**2)/.0022
        elif preset=="WMAP":
            l = 16*2**np.arange(8)
            amps = 10-np.exp(-l*l*(.22*np.pi/180.)**2)*5

        self.graphEqual.set_amps(amps)
        self.parent.cmbWindow.set_amps(amps)

class CMBDemoFrame(wx.Frame):
    def __init__(self, *args, **kwargs):
        wx.Frame.__init__(self, *args, **kwargs)
        
        self.cmbWindow  = CMBWindow(self)
        self.cmbWindow2  = CMBWindow(self)

        self.cmbWindow2.set_title("Original")

        self.cmbWindow2.amp=np.ones(8)*5.
        self.cmbWindow2.draw()

        self.controls   = Controls(self)

        font3 = wx.Font(46, wx.DEFAULT, wx.NORMAL, wx.NORMAL, False, 'Ubuntu')
        ge = wx.Panel(self)
        ge.SetBackgroundColour('Red')
        geheading = wx.StaticText(ge, label='Cosmic Microwave Background Graphic Equalizer',pos=(5,10))
        geheading.SetFont(font3)
        geheading.SetForegroundColour('White')


        sizer2 = wx.BoxSizer(wx.VERTICAL)

        sizer = wx.BoxSizer(wx.HORIZONTAL)
        sizer.Add(self.controls.sizer,0)
        sizer.Add(self.cmbWindow,2, wx.EXPAND)
        sizer.Add(self.cmbWindow2,2, wx.EXPAND)

        sizer2.Add(ge,0,wx.EXPAND)
        sizer2.Add(sizer,0,wx.EXPAND)


        self.SetSizer(sizer2)

class CMBWindow(wx.Window, Knob):
    def __init__(self, *args, **kwargs):
        wx.Window.__init__(self, *args, **kwargs)

        self.cmap = 'gray'
        self.load_image("Cloudy noise")
        self.amp = np.zeros(8,'f')

        self.A0 = Param(10., minimum=0., maximum=10., amp=self.amp, id=0)
        self.A1 = Param(10., minimum=0., maximum=10., amp=self.amp, id=1)
        self.A2 = Param(10., minimum=0., maximum=10., amp=self.amp, id=2)
        self.A3 = Param(10., minimum=0., maximum=10., amp=self.amp, id=3)
        self.A4 = Param(10., minimum=0., maximum=10., amp=self.amp, id=4)
        self.A5 = Param(10., minimum=0., maximum=10., amp=self.amp, id=5)
        self.A6 = Param(10., minimum=0., maximum=10., amp=self.amp, id=6)
        self.A7 = Param(10., minimum=0., maximum=10., amp=self.amp, id=7)
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
        
    def get_image(self, label):
        self.load_image(label)
        sky  = np.sum((10-self.amp)*self.sky,axis=2)/2. 
        self.imshow.set_data(sky)        
        self.imshow.set_cmap(self.cmap)

        self.repaint()

    def load_image(self, img):
        if img=="Planck CMB":
            hdu = fits.open('Planck_CMB_pack.fits')
            self.sky = np.transpose(hdu[0].data)/7.-1
            self.cmap='jet'
        elif img=="Planck dust":
            hdu = fits.open('Planck_353_pack.fits')
            self.sky = np.transpose(hdu[0].data)
            self.cmap='jet'
        elif img=="Cloudy noise":
            hdu = fits.open('cmb_maps.fits')
            self.sky = np.transpose(hdu[0].data)
        elif img=="Einstein":
            hdu = fits.open('einstein_pack.fits')
            self.sky = np.transpose(hdu[0].data)/2.-2
            self.cmap='gray'
        elif img=="Planck":
            hdu = fits.open('planck-satellite_pack.fits')
            self.sky = np.transpose(hdu[0].data)
            self.cmap='gray'
        elif img=="British Isles":
            hdu = fits.open('satellite-image-of-united-kingdom_pack.fits')
            self.sky = np.transpose(hdu[0].data)
            self.cmap='jet'
        hdu.close()

    def get_cmap(self, e):
        btn = e.GetEventObject()
        label = btn.GetLabel()
        self.cmap = label
        self.imshow.set_cmap(self.cmap)
        sky  = np.sum((10-self.amp)*self.sky,axis=2)/2. 
        self.imshow.set_data(sky)
        self.repaint()

    def set_amps(self,amps):
        self.draw()
        self.repaint()
            

    def draw(self):

        if not hasattr(self, 'subplot1'):
            self.subplot1 = self.figure.add_subplot(111)
            sky  = np.sum((10-self.amp)*self.sky,axis=2)/2. 
            self.imshow = self.subplot1.imshow(sky,vmin=-100,vmax=100,extent=[-7.5,7.5,-7.5,7.5])
            self.subplot1.set_xlabel("Degrees")
            self.subplot1.set_ylabel("Degrees")
        else:
            sky  = np.sum((10-self.amp)*self.sky,axis=2)/2. 
            self.imshow.set_data(sky)

#        ims.set_cmap(self.cmap)

    def repaint(self):
        self.canvas.draw()

    def setKnob(self, value):
        self.repaint()

    def set_title(self, title):
            self.subplot1.set_title(title)
        

class App(wx.App):
    def OnInit(self):
        self.frame1 = CMBDemoFrame(parent=None, title="CMB Graphic Equalizer", size=(1950, 850))
        self.frame1.Show()
        return True
        
app = App()
app.MainLoop()
