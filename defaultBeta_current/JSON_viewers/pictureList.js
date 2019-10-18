class pictureList {
  constructor() { // public: Creates a new pictureList instance
    this.dragging = null;
    this.newEntries = 0;
  }

  render(entry, domElement) { // public: Displays a picture list based on the data in the DOM element
    const data = entry.data;
    let page = app.getPage();
    let HTML = "";

    data.forEach(row => {
      HTML += `<div class="picListEntry clearfix" idr="${row.s_name}">
                <div class="picListPic clearfix"><img src="Content/${page}/images/${row.s_picture}"></div>
                <div class="picListDescription">${row.s_description}</div>
              </div>`;
    });

    domElement.innerHTML = HTML;
  }

  edit(name, section) { // public: Creates and returns a div containing an editor for a pictureList based on the given data
    const data = section.data || [];
    const sectionDiv = document.createElement('div');
    sectionDiv.setAttribute("id", `edit_JSON_section_${name}`);
    sectionDiv.setAttribute("class", "picListEditSectionDiv editSectionDiv");
    data.forEach(function(entry) {
      this.editAddEntry(sectionDiv, entry);
    }.bind(this));
    sectionDiv.innerHTML += `<input type="button" value="Add Item" onclick="app.pictureList.add(this)">`; // Add "add" button
    return sectionDiv;
  }

  editAddEntry(sectionDiv, entry) { // private: Adds an entry to the section div for editing a specitic entry on the picture list
    const name = sectionDiv.getAttribute('id').slice(18); // remove edit_JSON_section_
    sectionDiv.innerHTML += `
      <div id='edit_JSON_div_${name}_${entry.s_name}' class="entryDiv clearfix" sectionName='${name}' entryName='${entry.s_name}' draggable=true ondragstart="app.pictureList.drag(this, event)" ondrop="app.pictureList.drop(this, event)">
        <p class="editSectionEntry">
          <input idr="nameInput" value="${entry.s_name}" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)">
          <input type="button" onclick="app.expandCollapse(this)" value="__">
        </p>
        <div class="editPicListDiv clearfix">
          <img src='Content/${app.getPage()}/images/${entry.s_picture}'>
          <p class="picName hiddenNoExpand">${entry.s_picture}</p>
        </div>
        <div class="editPicListDiv clearfix">
          <textarea idr="description" rows="6"
          onmouseup="app.resizeAll(this)" onfocus="app.toggleInputFocus(this, event)"
          onblur="app.toggleInputFocus(this, event)">${entry.s_description}</textarea>
        </div>
        <div class="editPicListDiv clearfix">
          <p><input type="button" value="Delete" onclick="app.pictureList.removeRestore(this)"></p>
          <p><input type="button" value="Change image" onclick="app.pictureList.changeFile(this)"></p>
        </div>
      </div>`;
  }

  update(domElement, JSONobj) { // public: Returns a copy of the JSON object which has had all data from the given DOM element - a picList editor - added to it.
    JSONobj = JSON.parse(JSON.stringify(JSONobj));
    const newData = [];

    const sectionDiv = domElement.getElementsByClassName(`picListEditSectionDiv`)[0];
    const entryDivs = sectionDiv.getElementsByClassName('entryDiv');
    for (let i = 0; i < entryDivs.length; i++) {
      const entry = entryDivs[i];
      if (!(entry.classList.contains('deletedData'))) {
        const entryObj = {
          "s_name": app.domFunctions.getChildByIdr(entry, "nameInput").value,
          "s_description": app.domFunctions.getChildByIdr(entry, "description").value,
          "s_picture": entry.getElementsByClassName('picName')[0].textContent
        }

        if (entryObj.s_name && entryObj.s_description && entryObj.s_picture) {
          newData.push(entryObj);
        }
      }
    }

    const section = {};
    section.viewer = "pictureList";
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

    app.createImageGallery("app.pictureList.selectPicture", `'${sectionName}', '${entryName}', this`)
    .then(function(gallery){
      document.body.appendChild(gallery);
      gallery.innerHTML += `
        Choose new file <input type="file" onchange="app.pictureList.newFile(this)">
        <input type="button" value="Cancel" onclick="app.pictureList.closeChangeFile(this)">`;
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
    const sectionDiv = app.getAncestorByAttribute(button, "class", "picListEditSectionDiv");
    this.editAddEntry(sectionDiv, {"s_name":`newFile_${this.newEntries++}`, "s_picture":"", "s_description":""});
  }

  drag(entry, evnt) { // public: Records information about the item being dragged; used for rearranging entries
    this.dragging = entry;

    const data = {};
    const sectionDiv = entry.parentElement;
    data.sourceID = sectionDiv.getAttribute("id");
    evnt.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  drop(target, evnt) { // public: When something is dropped on a pictureList entry, verifies that it was another entry from the same list, then moves it to just before or after the entry it was dropped onto.
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
