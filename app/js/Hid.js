function Hid( receiveHandler, onConnect=null, onDisconnect=null ) {
  // constructor for HID USB class
  // https://trenvo.com/blog/2015/01/interacting-usb-hid-devices-web-apps/
  
  // initialize any variables
  this.targetDeviceCriteria = Hid.DEFAULT_TARGET_DEVICE  // vendor/product id
  this.pollerMs = Hid.DEFAULT_POLLER_MS
  this.hidDeviceInfo = null
  this.connection = null            // opaque ID used to identify connection in all other functions
  
  // store handlers for data sending/receiving
  this.sendHandler = null
  this.receiveHandler = receiveHandler
  
  // flag for whether clocking is being handled on PIC
  // (on board ) or by JS
  this.onBoardClocking = false
  
  // setup listener in case user ends up plugging in our device later
  // give calling function the option to specifiy own callback (useful
  // for GUIs and visiualization purposes)
  if ( onConnect == null )
    chrome.hid.onDeviceAdded.addListener( ( function( hidDeviceInfo ) { 
      this.connect( targetDeviceInfo=hidDeviceInfo )
    } ).bind(this) )
  else 
    chrome.hid.onDeviceAdded.addListener( onConnect )
  
  // same deal with disconnects (see above)
  if ( onDisconnect == null )
    chrome.hid.onDeviceRemoved.addListener( ( function( deviceId ) {
      this.disconnect( deviceId )
    } ).bind(this) )
  else
    chrome.hid.onDeviceRemoved.addListener( onDisconnect )
  
  return
}

// low-level system definitions (things may break if changed)
Hid.BUF_SIZE = 64             // bytes sent/received each transaction
Hid.DEFAULT_POLLER_MS = 10   // polls for data every ** ms 
// defaults of USB device information
// IMPORTANT: if you want different vendor/product id devices,
// make sure the app has permission to access said devices 
// within manifest.json
Hid.DEFAULT_TARGET_DEVICE = {
  "vendorId": 4617,
  "productId": 1
}

Hid.prototype.connect = function( targetDeviceInfo=null,
  successFunc=null, failureFunc=null ) {
  
  // first try to disconnect any current connection (this also 
  // re-inializes important variables)
  if ( this.hidDeviceInfo )
    this.disconnect( this.hidDeviceInfo.deviceId )
  
  // see what kind of USB hid devices are connected
  chrome.hid.getDevices( this.targetDeviceCriteria, function ( devicesHidDeviceInfo ) {
    
    console.log( 'Found ' + devicesHidDeviceInfo.length
      + ' HID devices matching criteria..' )
    if ( devicesHidDeviceInfo.length ) console.log( devicesHidDeviceInfo )
    
    // check if we even have any devices
    if ( devicesHidDeviceInfo.length==0 ) {
      failureFunc()
      return    // we are done here, we don't see anything
    } else if ( devicesHidDeviceInfo.length > 1 ) {
      console.log( 'I do not know what to do since we found multiple devices matching criteria...exiting connect function.' )
      failureFunc()
      return   // probably shouldn't find multiple devices, support for this could be added
    }
    
    // if we made it here, we are still okay, continue with trying to connect
    
    if ( targetDeviceInfo ) {
      // if caller has a specific device id in mind, use that one
      for ( var idx=0; idx<devicesHidDeviceInfo.length; idx++ ) {
        if ( targetDeviceInfo.deviceId == devicesHidDeviceInfo[idx].deviceId ) {
          this.hidDeviceInfo = devicesHidDeviceInfo[idx]
          break
        }
      }
      if ( !this.hidDeviceInfo ) {
        console.log( 'Could not find target device id ' + targetDeviceInfo.deviceId + '.' )
        failureFunc()
        return   // give up connecting, no harm no foul
      }
    } else {
      // otherwise, take what we can get
      this.hidDeviceInfo = devicesHidDeviceInfo[0]
    }
    
    // have our chrome app connect to this device
    chrome.hid.connect( this.hidDeviceInfo.deviceId, function ( con ) {
      
      // save this connection
      this.connection = con
      
      // begin polling USB HID interrupt pipe
      this.startHIDPoller()
      
      console.log( 'Connected and polling...' )
      
      successFunc()
      
      return
      
    }.bind(this) )
  
  }.bind(this) )
  
  return
}

Hid.prototype.disconnect = function( deviceId,
  successFunc=null, failureFunc=null ) {
  
  // check to make sure the device that was removed was the connected device
  if ( deviceId != this.hidDeviceInfo.deviceId ) {
    console.log( "Don't recognize device to be removed." )
    if ( failureFunc )
      failureFunc()
    return
  }
  
  
  // looks like the removed deviced was our guy, try to disconnect it
  // No need to do this, this will just mess us up later on, async...
  //if ( this.hidDeviceInfo )
  //  chrome.hid.disconnect( this.connection, null )
  
  // clear out any variables
  this.hidDeviceInfo = null
  this.connection = null            // opaque ID used to identify connection in all other functions
  this.onBoardClocking = false      // flag containing knowledge of whether RTCC operations on MCU
  
  console.log( 'Currently connected device removed.' )
  
  if ( successFunc )
    successFunc()
  
  return true
}

Hid.prototype.startHIDPoller = function() {
  
  // use anonymous function to keep the variables in scope
  var poller = function () {
    
    // get out of here if we don't have our connection
    if ( this.connection == null )
      return
    
    // receive the next input report from the device
    var connectionId = this.connection.connectionId
    chrome.hid.receive( connectionId, function ( reportID, data ) {
      
      // handle received event with handler
      var event = this.receiveHandler( data )
      if ( event ) {
        console.log( 'Event received from handler: ' + event )
      }
      
      // keep doing all this
      window.setTimeout( poller.bind(this), this.pollerMs )
      
      return
    }.bind(this) )
  
  }.bind(this)
  
  // only run if we are still connected to HID device
  if ( this.connection )
    poller()
  
  return
}

