// All viewers need a render function, an edit function and an update function
class checkList {
  constructor() { // public: Creates a new checkList instance
    this.dragging = null;
    this.newEntries = 0;
  }

  render(entry, domElement) { // public: Displays a check list based on the data in the DOM element
    const data = entry.data;
    let page = app.getPage();
    let HTML = "";

    data.forEach(row => {
      if (row.s_value == null) row.s_value = row.s_name;
      HTML += `<p><input type="checkbox" value="${row.s_value}">${row.s_description}</p>`;
    });

    domElement.innerHTML = HTML;
  }

  edit(name, section) { // public: Creates and returns a div containing an editor for a checkList based on the given data
    const data = section.data || [];
    const sectionDiv = document.createElement('div');
    sectionDiv.setAttribute("id", `edit_JSON_section_${name}`);
    sectionDiv.setAttribute("class", "checkListEditSectionDiv editSectionDiv");
    data.forEach(function(entry) {
      this.editAddEntry(sectionDiv, entry);
    }.bind(this));
    sectionDiv.innerHTML += `<input type="button" id="add_button_${name}" value="Add Item" onclick="app.checkList.add(this)">`; // Add "add" button
    return sectionDiv;
  }

  editAddEntry(sectionDiv, entry) { // private: Adds an entry to the section div for editing a specitic entry on the check list
    const name = sectionDiv.getAttribute('id').slice(18); // remove edit_JSON_section_
    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
      <div id='edit_JSON_div_${name}_${entry.s_name}' class="entryDiv clearfix" sectionName='${name}' entryName='${entry.s_name}' draggable=true ondragstart="app.checkList.drag(this, event)" ondrop="app.checkList.drop(this, event)">
        <p class="editSectionEntry">
          <input idr="nameInput" value="${entry.s_name}" onfocus="app.toggleInputFocus(this, event)" onblur="app.toggleInputFocus(this, event)">
          <input type="button" onclick="app.expandCollapse(this)" value="__">
        </p>
        <div class="editCheckListDiv clearfix">
          <p>Value (used when saving): <input idr="value" value="${entry.s_value}"></p>
          <textarea idr="description" rows="6"
          onmouseup="app.resizeAll(this)" onfocus="app.toggleInputFocus(this, event)"
          onblur="app.toggleInputFocus(this, event)">${entry.s_description}</textarea>
        </div>
      </div>`;

      const addButton = document.getElementById(`add_button_${name}`);

    sectionDiv.insertBefore(newDiv, addButton);
  }

  update(domElement, JSONobj) { // public: Returns a copy of the JSON object which has had all data from the given DOM element - a checkList editor - added to it.
    JSONobj = JSON.parse(JSON.stringify(JSONobj));
    const newData = [];

    const sectionDiv = domElement.getElementsByClassName(`checkListEditSectionDiv`)[0];
    const entryDivs = sectionDiv.getElementsByClassName('entryDiv');
    for (let i = 0; i < entryDivs.length; i++) {
      const entry = entryDivs[i];
      if (!(entry.classList.contains('deletedData'))) {
        const entryObj = {
          "s_name": app.domFunctions.getChildByIdr(entry, "nameInput").value,
          "s_description": app.domFunctions.getChildByIdr(entry, "description").value,
          "s_value": app.domFunctions.getChildByIdr(entry, "value").value
        };

        if (entryObj.s_name && entryObj.s_description) {
          newData.push(entryObj);
        }
      }
    }

    const section = {};
    section.viewer = "checkList";
    section.data = newData;
    const nameText = app.domFunctions.getChildByIdr(domElement, "sectionTextBox");
    const name = nameText.value;
    JSONobj[name] = section;

    return JSONobj;
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
    const sectionDiv = app.getAncestorByAttribute(button, "class", "checkListEditSectionDiv");
    this.editAddEntry(sectionDiv, {"s_name":`newFile_${this.newEntries++}`, "s_description":""}, button);
  }

  drag(entry, evnt) { // public: Records information about the item being dragged; used for rearranging entries
    this.dragging = entry;

    const data = {};
    const sectionDiv = entry.parentElement;
    data.sourceID = sectionDiv.getAttribute("id");
    evnt.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  drop(target, evnt) { // public: When something is dropped on a checkList entry, verifies that it was another entry from the same list, then moves it to just before or after the entry it was dropped onto.
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
