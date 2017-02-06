var curtain;
var statusBar;
var mouseState = {
  clicked: false
}

function initBase() {

  // make sure user is using chrome
  if ( typeof chrome == 'undefined' ) {
    console.log( "You're gonna need to use Chrome to get this to work..."
    )
  }
  
  // do fancy window moving based on number of monitors
  chrome.system.display.getInfo( 
    function( displayInfo ) { 
      
      // determine number of display monitors we see
      var numMonitors = displayInfo.length
      console.log( 'I see ' + numMonitors + ' monitor(s)' )
      
      // resize app to half the screen
      //chrome.app.window.current().outerBounds.width = Math.round( displayInfo[numMonitors-1].bounds.width / 2 )
      //chrome.app.window.current().outerBounds.height = displayInfo[numMonitors-1].bounds.height
      
      // move app to left-top side of screen
      //chrome.app.window.current().outerBounds.top = 0
      //chrome.app.window.current().outerBounds.left = displayInfo[numMonitors-1].bounds.left
      
      return
    }
  )
  
  
  // more or less damage control designed to look like nice (a.k.a. loading Screen )
  // (adding the curtain to the DOM is not done dynamically to ensure that it is
  // already there before user can mess stuff up)
  curtain = document.getElementById( 'loadingCurtain' )
  
  // get handle to nice status bar object so we can change its state whenever
  // we want
  statusBar = document.getElementById( 'statusBar' )
  
  // set up interactions for toolbox
  Array.prototype.slice.call(document.getElementById( 'rightSidebarContents' ).children).map( function( obj1, idx1 ) {
    obj1.children[0].addEventListener( 'click', function() {
      Array.prototype.slice.call(document.getElementById( 'rightSidebarContents' ).children).map( function( obj2, idx2 ) {
        if ( idx1 == idx2 ) {
          obj2.classList.add( 'open' )
        } else {
          obj2.classList.remove( 'open' )
          obj2.scrollTop = 0    // needed to ensure scrollable divs show header (top) when closed
        }
      } )
    } )
  }, false )
  // open first toolbox in sidebare
  document.getElementById( 'rightSidebarContents' ).children[0].children[0].click()
  
  // add any click events to exiting DOM objects (chrome apps don't let
  // us put inline js in the html file
  document.getElementById( 'rightSidebarMenuButton' ).addEventListener( 'click', function() { 
    
    // first add shrink class to container
    this.parentElement.parentElement.classList.toggle( 'shrink' )
    
    // also add shrink class to children DOM objects of container
    if ( rightSidebar.classList.contains( 'shrink' ) )
      delay = 0
    else
      delay = 500
    window.setTimeout( function() { Array.prototype.slice.call(this.parentElement.parentElement.children).map( function( obj ) {
      obj.classList.toggle( 'shrink' )
    } ) }.bind(this), delay )
    
    // finally shift focus to current log element (if visible)
    /*var logQueue = document.getElementById( 'rightSidebarToolboxOne' ).children[0].obj.logQueue
    if ( logQueue.length && !this.parentElement.parentElement.classList.contains( 'shrink' ) )
      window.setTimeout( function() { logQueue[0].focus() }, parseFloat((window.getComputedStyle(this.parentElement.parentElement).transitionDuration).replace(/[^\d.-]/g,''))*1000 )
    */
    
    // now add approriate class to all paths in svg
    hamburger( 'toggle' )
    
  } )
  
  // add listeners to keep track of mouse state
  $(document).mousedown( function() {
    mouseState.clicked = true
    //console.log( 'Mouse has been clicked.' )
  } ).mouseup( function() {
    mouseState.clicked = false
    //console.log( 'Mouse has been un-clicked.' )
  } )
  
  return
}

function hideCurtain() {
  
  curtain.style.visibility = 'hidden'
  curtain.style.opacity = 0
  
  return
}

function showCurtain() {
  
  curtain.style.visibility = 'visible'
  curtain.style.opacity = 1
  
  return
}

function setStatusBar( state='' ) {
  
  switch ( state ) {
    case '':
      statusBar.classList.remove( 'active' )
      statusBar.classList.remove( 'inactive' )
      break
    case 'inactive':
      statusBar.classList.remove( 'active' )
      statusBar.classList.add( 'inactive' )
      break
    case 'active':
      statusBar.classList.remove( 'inactive' )
      statusBar.classList.add( 'active' )
      break
    default:
      console.log( 'Unknown status bar state: ' + state )
  }
  
  return
}

function hamburger( state='toggle' ) {
  
  var menuSvgPathNodes = document.getElementById( 'rightSidebarMenuButton' ).children[0].contentDocument.querySelectorAll( 'path' )
  Array.prototype.slice.call(menuSvgPathNodes).map( function( obj ) {
    switch ( state ) {
      case 'toggle':
        obj.classList.toggle( 'unhamburger' )
        break
      case 'un':
        obj.classList.add( 'unhamburger' )
        break
      case 're':
        obj.classList.remove( 'unhamburger' )
        break
      default:
        console.log( 'Unknown hamburger state: ' + state )
    }
  } )
  
  return
}