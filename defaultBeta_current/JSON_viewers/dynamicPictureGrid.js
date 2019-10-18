class dynamicPictureGrid {
  constructor() { // public: Creates a new dynamicPictureGrid instance
    this.updateDelay = 5000; // measured in milliseconds
    this.availablePics = []; // Array of all entry objects that are NOT expired or missing - ones in use will be marked but not removed

    this.defaultRows = 1; // If no row number is specified, have one row
    this.defaultCols = 1; // If no column number is specified, have one column
    this.defaultWidth = 100;  // Width of the whole grid, in percent of the container
    this.defaultRowHeight = 200; // Height of a picture, in pixels

    this.gridWidth = null;
    this.gridHeight = null;
    this.picWidth = null; // Width of each picture - calculated based on maxWidth and gridGap
    this.divHeight = null;
    this.picHeight = null;
    this.textHeight = 50; // Leave space for text
    this.refreshTimer = null;

    this.container = null;
    this.dragging = null;
    this.newEntries = 0;
  }

  render(entry, domElement) { // public: Displays a picture list based on the data in the DOM element
    const rows = parseInt(entry.rows) || this.defaultRows;
    const cols = parseInt(entry.cols) || this.defaultCols;
    this.gridWidth = parseInt(entry.width) || this.defaultWidth;
    this.divHeight = parseInt(entry.height) || this.defaultRowHeight;

    this.picWidth = 100/cols; // width of each picture div, in percent of the container
    this.picHeight = this.divHeight - this.textHeight; // Work on this - this will hide all text

    const data = entry.data;
    this.container = domElement;

    let columnsText = "";
    for (let i = 0; i < cols; i++) {
      columnsText += `${this.picWidth}% `;
    }

    let HTML = `<div class="gridContainer" idr="gridContainer" style="width:${this.gridWidth}%;grid-template-columns:${columnsText}">`;
    for (let i = 0; i < rows*cols; i++) {
      HTML += `<div idr="entry_${i}" style="height:${this.divHeight}" class="clearfix">
        <a target="_blank" idr="link_${i}" style="height:100%;width:100%">
          <img idr="picture_${i}" style="height:${this.picHeight}">
        </a>
        <div idr="text_${i}"></div>
      </div>`
    }
    HTML += "</div>";
    domElement.innerHTML = HTML;

    const imageElements = Array.from(domElement.getElementsByTagName("IMG"));

    this.getPics(data)
    .then(this.loadPics.bind(this, domElement));
  }

  getPics(pictures) { // private: Checks each item in the picture list to verify that it can be found in the images folder and has not expired. Removes any that don't meet these criteria and stores the rest in this.availablePics
    this.availablePics = [];
    return app.getFileNames(`Content/${app.getPage()}/images`)
    .then(function(filenames) {
      pictures.forEach(function(picObj) {
        const exists = filenames.includes(picObj.s_picture); // A file exists if it's in the images gallery
        const current = !(picObj.d_date && picObj.d_date < Date.now()); // A file is current if it has no expiration date, or the expiration date has not passed
        if (exists && current) {
          this.availablePics.push(picObj);
        }
      }.bind(this))
    }.bind(this))
  }

  loadPics() {
    const gridContainer = app.domFunctions.getChildByIdr(this.container, 'gridContainer');
    const divs = Array.from(gridContainer.children);
    divs.forEach(function(div) {
      const pic = this.choosePicture();
      if (pic) {
        this.insertPicture(div, pic);
      }
      else {
        div.parentElement.removeChild(div);
      }
    }.bind(this))

    if (this.availablePics.filter(x => !(x.image)).length > 0) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      this.refreshTimer = setInterval(this.changePicture.bind(this), this.updateDelay);
    }
  }

  insertPicture(div, picObj) {
    const num = div.getAttribute("idr").slice(6); // remove entry_
    const image = app.domFunctions.getChildByIdr(div, `picture_${num}`);
    const text = app.domFunctions.getChildByIdr(div, `text_${num}`);
    const link = app.domFunctions.getChildByIdr(div, `link_${num}`)

    image.src = `Content/${app.getPage()}/images/${picObj.s_picture}`;
    image.onload=function() {
      text.innerHTML = `<p style="text-align:center">${picObj.s_description}</p>`;
      link.href = picObj.l_link;
    }

    const imageIDR = image.getAttribute("idr");

    const oldPic = this.availablePics.find(x => x.image === imageIDR);
    if (oldPic) {
      oldPic.image = null;
    }

    picObj.image = imageIDR;
  }

  changePicture() {
    const gridContainer = app.domFunctions.getChildByIdr(this.container, 'gridContainer');
    const divs = Array.from(gridContainer.children);
    const length = divs.length;
    const index = Math.floor(Math.random() * length);
    const div = divs[index];
    const pic = this.choosePicture();

    this.insertPicture(div, pic);
  }

  choosePicture() {
    const freePics = this.availablePics.filter(x => !(x.image));
    if (freePics.length === 0) return null;

    let totalWeight = 0; // Will end up being the sum of all pictures' weights
    const ranges = []; // Each entry will be an object containing the min and max for the corresponding picture
    freePics.forEach(function(pic) {
      const weight = parseInt(pic.i_weight) || 1;
      const rangeObj = {min:totalWeight + 1, max:totalWeight + weight};
      ranges.push(rangeObj);
      totalWeight += weight;
    })

    const randomInt = Math.floor(Math.random() * totalWeight) + 1;
    const index = ranges.findIndex(x => x.min <= randomInt && x.max >= randomInt);
    return freePics[index];
  }

  edit(name, section) { // public: Creates and returns a div containing an editor for a dynamicPictureGrid based on the given data
    const data = section.data || [];
    const sectionDiv = document.createElement('div');
    sectionDiv.setAttribute("id", `edit_JSON_section_${name}`);
    sectionDiv.setAttribute("class", "picGridEditSectionDiv");
    sectionDiv.innerHTML += `
      <p>Rows (default 1):<input idr="rows" value=${section.rows || 1}></p>
      <p>Columns (default 1):<input idr="cols" value=${section.cols || 1}></p>
      <p> Width (in % of the content div, default ${this.defaultWidth}):<input idr="width" value=${section.width || this.defaultWidth}></p>
      <p>Height of each row (in pixels, default ${this.defaultRowHeight}):<input idr="height" value=${section.height || this.defaultRowHeight}></p>
      <div idr="itemDiv" class="editItemDiv"></div>`;
    const itemDiv = app.domFunctions.getChildByIdr(sectionDiv, "itemDiv");
    itemDiv.setAttribute("id", `edit_JSON_items_${name}`);
    data.forEach(function(entry) {
      this.editAddEntry(itemDiv, entry);
    }.bind(this));
    sectionDiv.innerHTML += `<input type="button" value="Add Item" onclick="app.dynamicPictureGrid.add(this)">`; // Add "add" button
    return sectionDiv;
  }

  editAddEntry(itemsDiv, entry) { // private: Adds an entry to the section div for editing a specitic entry on the picture list
    const name = itemsDiv.getAttribute('id').slice(16); // remove edit_JSON_items_
    const newDiv = document.createElement('div');
    const addButton = document.getElementById(`add_button_${name}`);

    newDiv.innerHTML = `
      <div id='edit_JSON_div_${name}_${entry.s_name}' class="entryDiv clearfix" sectionName='${name}' entryName='${entry.s_name}' draggable=true ondragstart="app.dynamicPictureGrid.drag(this, event)" ondrop="app.dynamicPictureGrid.drop(this, event)">
        <p class="editSectionEntry">
          <input idr="nameInput" value="${entry.s_name}" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)">
          <input type="button" onclick="app.expandCollapse(this)" value="__">
        </p>
        <div class="editPicGridDiv clearfix">
          <img src='Content/${app.getPage()}/images/${entry.s_picture}'>
          <p class="picName hiddenNoExpand">${entry.s_picture}</p>
          <p>Caption: <input idr="captionInput" value="${app.parseText(entry.s_description)}" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)"></p>
          <p>Link:<input idr="linkInput" value="${app.parseText(entry.l_link)}" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)"></p>
          <p>Expires: <input idr="expireInput" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)" value="${this.parseDate(entry.d_date)}" onchange="this.value=app.dynamicPictureGrid.parseDate(this.value)"></p>
          <p>Priority: <input idr="priorityInput" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)" value="${entry.i_weight}" onchange="app.dynamicPictureGrid.checkNumber(this)"></p>
          <p><input type="button" value="Delete" onclick="app.dynamicPictureGrid.removeRestore(this)"></p>
          <p><input type="button" value="Change image" onclick="app.dynamicPictureGrid.changeFile(this)"></p>
        </div>
      </div>`;

    itemsDiv.insertBefore(newDiv, addButton);  
  }

  parseDate(text) {
    if (!text) return "";
    const date = new Date(text);
    if (isNaN(date)) {
      return "";
    } else {
      return date.toDateString();
    }
  }

  checkNumber(input) {
    const int = parseInt(input.value);
    if (isNaN(int)) input.value = "";
    else input.value = int;
  }

  update(domElement, JSONobj) { // public: Returns a copy of the JSON object which has had all data from the given DOM element - a picGrid editor - added to it.
    JSONobj = JSON.parse(JSON.stringify(JSONobj));
    const newData = [];

    const sectionDiv = domElement.getElementsByClassName(`picGridEditSectionDiv`)[0];
    const entryDivs = sectionDiv.getElementsByClassName('entryDiv');
    for (let i = 0; i < entryDivs.length; i++) {
      const entry = entryDivs[i];
      if (!(entry.classList.contains('deletedData'))) {
        const entryObj = {
          "s_name": app.domFunctions.getChildByIdr(entry, "nameInput").value,
          "s_description": app.domFunctions.getChildByIdr(entry, "captionInput").value,
          "s_picture": entry.getElementsByClassName('picName')[0].textContent,
          "l_link":app.domFunctions.getChildByIdr(entry, "linkInput").value
        }

        const date = Date.parse(app.domFunctions.getChildByIdr(entry, "expireInput").value);
        if (date > 0) {
          entryObj.d_date = date;
        }

        const weight = parseInt(app.domFunctions.getChildByIdr(entry, "priorityInput").value);
        if (weight > 0) {
          entryObj.i_weight = weight;
        }

        if (entryObj.s_name && entryObj.s_picture) {
          newData.push(entryObj);
        }
      }
    }

    const section = {};
    section.viewer = "dynamicPictureGrid";
    section.rows = app.domFunctions.getChildByIdr(domElement, "rows").value;
    section.cols = app.domFunctions.getChildByIdr(domElement, "cols").value;
    section.width = app.domFunctions.getChildByIdr(domElement, "width").value;
    section.height = app.domFunctions.getChildByIdr(domElement, "height").value;
    section.data = newData;
    const nameText = app.domFunctions.getChildByIdr(domElement, "sectionTextBox");
    const name = nameText.value;
    JSONobj[name] = section;

    return JSONobj;
  }

  saveFile(pic, entry) {
    return app.uploadFile(pic).then(function(name) {
      if (entry) { //  if an editor entry was passed in
        // Update the text of the file
        const namePar = entry.getElementsByClassName('picName')[0];
        namePar.textContent = name;
        // Update the preview of the file
        const image = entry.getElementsByTagName('IMG')[0];
        image.src = `Content/${app.getPage()}/images/${name}`;
      }
    });
  }

  changeFile(button) { // public: Creates an image gallery that calls selectPicture when an image is clicked. Also adds a "new file" button to upload a new file, and a "cancel" button to close the gallery without selecting anything.
    const entryDiv = app.getAncestorByAttribute(button, "class", "entryDiv");
    const sectionName = entryDiv.getAttribute("sectionName");
    const entryName = entryDiv.getAttribute("entryName");

    app.createImageGallery("app.dynamicPictureGrid.selectPicture", `'${sectionName}', '${entryName}', this`)
    .then(function(gallery){
      document.body.appendChild(gallery);
      gallery.innerHTML += `
        Choose new file <input type="file" onchange="app.dynamicPictureGrid.newFile(this)">
        <input type="button" value="Cancel" onclick="app.dynamicPictureGrid.closeChangeFile(this)">`;
      gallery.setAttribute("entryName", entryDiv.getAttribute("entryName"));
      gallery.setAttribute("sectionName", entryDiv.getAttribute("sectionName"));

      const bounds = button.getBoundingClientRect();
      gallery.setAttribute("style", `left:${bounds.left + window.scrollX}px; top:${bounds.top + window.scrollY}px`);
    })
  }

  selectPicture(pictureName, section, entry, DOMelement) { // public: Shows the chosen image in the editor, and sets the image name to its name (so that next time the JSON file is updated, the correct image name will be stored)
    const entryDiv = document.getElementById(`edit_JSON_div_${section}_${entry}`);
    const image = entryDiv.getElementsByTagName('IMG')[0];
    image.src = `Content/${app.getPage()}/images/${pictureName}`;

    const namePar = entryDiv.getElementsByClassName('picName')[0];
    namePar.textContent = pictureName;

    if (app.getProp(this.uploadedPics, section, entry)) this.uploadedPics[section][entry] = null;
    this.closeChangeFile(DOMelement);
  }

  newFile(button) { // private: Fires when the user chooses a picture to upload; displays the picture in the editor and sets the image name to its name
    // Get file
    const file = app.getProp(button, "files", 0);
    const gallery = app.getAncestorByAttribute(button, "class", "imageGallery");
    const sectionName = gallery.getAttribute("sectionName");
    const entryName = gallery.getAttribute("entryName");

    this.closeChangeFile(button);

    const entryDiv = document.getElementById(`edit_JSON_div_${sectionName}_${entryName}`);
    return this.saveFile(file, entryDiv);
  }

  closeChangeFile(DOMelement) { // private: Closes the image gallery without choosing a new file or changing anything in the editor
    const gallery = app.getAncestorByAttribute(DOMelement, "class", "imageGallery");
    if (gallery && gallery.parentElement) {
      gallery.parentElement.removeChild(gallery);
    }
  }

  removeRestore(button) { // public: Adds or removes the "deletedData" class from the entry div containing the button.
    // Get the entry div the button was part of
    const entryDiv = app.getAncestorByAttribute(button, "class", "entryDiv");
    if (button.value === "Delete") {
      entryDiv.classList.add("deletedData");
      button.value = "Restore";
    }
    else if (button.value === "Restore") {
      entryDiv.classList.remove("deletedData");
      button.value = "Delete";
    }
    else {
      app.error(`Delete/restore button should say "Delete" or "Restore"; actually says "${button.value}"`);
    }
  }

  add(button) { // public: finds the JSON section that the add button was in and calls editAddEntry to add a blank entry to it.
    const sectionDiv = app.getAncestorByAttribute(button, "class", "picGridEditSectionDiv");
    this.editAddEntry(sectionDiv, {"s_name":`newFile_${this.newEntries++}`, "s_picture":"", "s_description":"", "d_date":null, "i_weight":1});
  }

  drag(entry, evnt) { // public: Records information about the item being dragged; used for rearranging entries
    this.dragging = entry;

    const data = {};
    const sectionDiv = entry.parentElement;
    data.sourceID = sectionDiv.getAttribute("id");
    evnt.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  drop(target, evnt) { // public: When something is dropped on a dynamicPictureGrid entry, verifies that it was another entry from the same list, then moves it to just before or after the entry it was dropped onto.
    const dataText = evnt.dataTransfer.getData("text/plain");
    if (!app.isJson(dataText)) {
      app.error(`${dataText} is not valid JSON`); // This won't fix the problem, but it means the next time it happens, there will be more detail in the error message
      return;
    }
    const data = JSON.parse(dataText);
    const source = data.sourceID;

    const sectionDiv = target.parentElement;
    if (sectionDiv.getAttribute("id") === source) {
      if (this.dragging.offsetTop < target.offsetTop) { // drag down
        sectionDiv.insertBefore(this.dragging, target.nextSibling); // Insert after target
      }
      else { // drag up
        sectionDiv.insertBefore(this.dragging, target); // Insert before target
      }
    }

    this.dragging = null;
  }
}
