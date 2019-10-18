/*
//public
getChildByIdr(element, idr, deep) - Returns the first element it finds within the given element with the given IDR.
widgetGetId(domElement) - Returns the ID of the smallest widget that the given element is part of.
*/

class domFunctions {
  constructor() {}

  // Takes a DOM element and an idr to search for within it. Searches through the element's children, then their children
  // and so on, until it finds an element with that idr, and returns that element. Returns null if it finds no such element.
  // If other widgets are nested inside the element passed in, default is NOT to search them, but you can pass in a boolean
  // "deep" value that determines whether to keep going.
  getChildByIdr(element, idr, deep) {
    if (!(element && element.children)) {
      app.error(`Searching for idr ${idr}, but the parent element does not exist or has no children`);
    }
    if (element.children) {
      const children = Array.from(element.children); // Get the element's children
      while (children.length > 0) {
        const child = children.pop(); // For each child...
        if (child.getAttribute("idr") == idr) {
          return child; // If the idr matches, return the element...
        }
        // If the child is not a widget itself (or a deep search is being done), and it has children...
        else if ((!child.classList.contains("widget") || deep) && child.children.length > 0) {
          children.push(...child.children); // add its children to the children array
        }
      }
    }
  	return null; // return null if no idr matches
  }

  // Takes a DOM element as an argument and returns the ID of the widget that element is part of.
  // If the element is part of nested widgets, returns the inner one. If it's not part of any widget,
  // produces an error message and returns null.
  widgetGetId(domElement) {
  	if (domElement.classList.contains("widget")) {
  		// found start of widget
  		return(domElement.getAttribute("id"));
  	}
    else if (domElement.parentElement){ // if the parent element exists - if we haven't gone all the way up the tree looking for a widget
      // call this method recursively, working up the tree until you either find a widget or run out of parents.
  		return(this.widgetGetId(domElement.parentElement));
  	}
    else {
      app.error("Searched for the widget ID of an element which is not in a widget.");
      return null;
    }
  }
}
