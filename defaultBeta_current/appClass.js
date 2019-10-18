class appClass {
  constructor(beta) { // public: Creates a new instance of appClass.
    this.beta = beta;                       // boolean: Whether we're showing items marked as "beta"
    this.highlightedDOM = null;             // DOM element: The menu button which is currently highlighted
    this.domFunctions = new domFunctions(); // Class instance: Includes widgetGetID and getChildByIdr functions
    this.widgets = {};                      // object: Keys are widget IDs, values are widget class instances
    this.idCounter = 0;                     // int: The number of widgets which have been made so far; will be the ID of the next widget created
    this.cache = {};                        // object: Cache of all docs retrieved from the database

    this.dragLastX = null;                  // number: The last x-position of the mouse, used when dragging
    this.dragLastY = null;                  // number: The last y-position of the mouse, used when dragging
    this.dragging = null;                   // DOM element: The item currently being dragged, if any

    this.optionalFilesLoaded = {};          // object:  Keys are optional files requested so far; values are the promises to load them
    document.body.setAttribute("ondragover", "event.preventDefault()");

    this.menuIndex = 0;                     // Used to keep track of where on the nav menu each button is when building the menu
  }

  // Assumes that filename is the name of an HTML file in the appPublic2 folder.
  // Requests the file and plugs its contents into the given DOM element.
  render(DOMelement, filename, extension="html") { // private: Gets the file and plugs its content into the DOMelement
    const wholeName = `${filename}.${extension}`;

    return this.getFile(wholeName)
    .then(function(responseText) {
      DOMelement.innerHTML = responseText;
    })
  }

  cleanUpWhitespace(JSONtext) { // private: Removes /n and /t from those parts of a stringified JSON object which won't still be in strings once it's parsed; escapes the ones that will be in strings
    let parts = JSONtext.split('"'); // Every other part is inside a string
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) { // Even parts are OUTSIDE strings, and newlines and tabs should be removed
        parts[i] = parts[i].replace(/\n|\t/g, "");
      }
      else { // Odd parts are INSIDE strings, and newlines and tabs should be escaped
        parts[i] = parts[i].replace(/\n/g, "\\n").replace(/\t/g, "\\t");
      }
    }

    return parts.join('"');
  }

  renderContent(filename=this.getPage(), JSONtext) { // public: Renders the HTML, JSON and JS for a particular page
    this.updateRecords(filename);

    let contentDOM = null;
    let JSONobj = null;

    // First, get the JSON file, if necessary
    let filePromise = Promise.resolve(JSONtext);
    if (!JSONtext) filePromise = this.getFile(`Content/${filename}/_.JSON`, true, "{}");
    return filePromise.then(function(responseText) { // Then render the template and controls
      responseText = this.cleanUpWhitespace(responseText);
      JSONobj = JSON.parse(responseText);
      app.showControls();
      const template = JSONobj.template;
      contentDOM = document.getElementById("contentDiv");
      return this.render(contentDOM, `templates/${template}`);
    }.bind(this))
    .then(function() { // Then fill in any HTML sections
      for (let section in JSONobj.HTML) {
        const sectionDOM = contentDOM.querySelector(`[sectionIDR="${section}"]`);
        if (JSONobj.HTML[section]) {
          sectionDOM.innerHTML = JSONobj.HTML[section];
        }
        else {
          sectionDOM.parentElement.removeChild(sectionDOM);
        }
      }
    }.bind(this))
    .then(function() { // Then render any JSON viewers
      if (JSONobj.JSON) {
        for (let elementName in JSONobj.JSON) {
          const entry = JSONobj.JSON[elementName];
          const viewer = entry.viewer;
          const domElement = document.getElementById(elementName);
          const data = entry.data;
          if (this[viewer]) {
            this[viewer].render(entry, domElement);
          }
          else {
            this.checkJSFile(`JSON_viewers/${viewer}`).then(function() {
              Function(`app.${viewer} = new ${viewer}()`)();
              this[viewer].render(entry, domElement);
            }.bind(this));
          }
        }
      }
    }.bind(this))
    .then(function() { // Finally, run any JS
      if (JSONobj.JS) {
        eval(JSONobj.JS);
      }
    });
  }

  updateRecords(filename) { // private: Updates the history div, stored list of menu items and record of the last item clicked
    this.renderHistory(filename); // Updates the history div

    // Create flattened nav array if it doesn't already exist
    if (!sessionStorage.getItem("menuList")) sessionStorage.setItem("menuList", JSON.stringify(this.listPages()));

    // If there's no record of the last menu item clicked, set it to this page's first appearance on the menu
    if (!sessionStorage.getItem("lastMenuIndex" > -1)) {
      const list = JSON.parse(sessionStorage.getItem("menuList"));
      const page = this.getPage();
      const index = list.findIndex(x => x.HTML === page);
      sessionStorage.setItem("lastMenuIndex", index);
    }
  }

  renderHistory(filename) { // private: Updates the history div
    // Get the history array if it exists; if not, make it an empty array
    let history = JSON.parse(sessionStorage.getItem("history"));
    if (!history) {
      history = [];
    }

    let nav = JSON.parse(sessionStorage.getItem("nav.JSON"));

    // Remove the filename from the array if it was already there
    if (history.includes(filename)) {
      history.splice(history.indexOf(filename), 1);
    }

    // Add the filename at the end of the array
    history.push(filename);

    // Store the updated history list in sessionStorage
    sessionStorage.setItem("history", JSON.stringify(history));

    // Build the history list - for each item, show the name and link to the page
    const historyDiv = document.getElementById("historyDiv");
    historyDiv.innerHTML = "History: ";

    let currentLocation = window.location.href;
    if (currentLocation.indexOf('?') > -1) {
      currentLocation = currentLocation.slice(0, currentLocation.indexOf('?'));
    }

    for (let i = 0; i < history.length; i++) {
      const navEntry = nav.find(x => x.HTML===history[i]);
      if (navEntry) {
        historyDiv.innerHTML +=
        `<a href="${currentLocation}?page=${history[i]}">${navEntry.name}</a>&nbsp;&nbsp;&nbsp;`;
      }
      else {
        historyDiv.innerHTML +=
        `<a href="${currentLocation}?page=${history[i]}">${history[i]}</a>&nbsp;&nbsp;&nbsp;`;
      }
    }
  }

  goToPage(page) { // public: Navigates to the given page in the current website
    let currentLocation = window.location.href;
    if (currentLocation.indexOf('?') > -1) {
      currentLocation = currentLocation.slice(0, currentLocation.indexOf('?'));
    }

    window.location.assign(`${currentLocation}?page=${page}`);
  }

  // Assumes that there is a DOM element with the ID "headerDiv",
  // and that there is a "header.html" file in the appPublic2 folder.
  // Calls render to request the "header.html" file and plug it into the headerDiv element.
  renderHeader() { // public: Gets the HTML page for the header and displays it in the header div
    const DOMelement = document.getElementById("headerDiv");
    return this.render(DOMelement, "header");
  }

  // Assumes that there is a DOM element with the ID "footerDiv".
  // and that there is a "footer.html" file in the appPublic2 folder.
  // Calls render to request the "footer.html" file and plug it into the footerDiv element.
  renderFooter() { // public: Gets the HTML page for the footer and displays it in the footer div
    const DOMelement = document.getElementById("footerDiv");
    return this.render(DOMelement, "footer");
  }

   // Assumes that there is a DOM element with the ID "navDiv", that there is a "nav.html" file in the appPublic2 folder,
   // that either in the main page or in nav.html there is a list (<UL> or <OL> with the id "menu-top-nav"),
   // and that there is a nav.JSON file in the appPublic2 folder. (Detailed assumptions about this are found at buildNavEntry.)
   // The function calls render to request the nav.html file and plug it into the navDiv, then requests the nav.JSON file
   // and repeatedly calls the buildNavEntry function to build up HTML for the list items in the nav bar.
   // Once the HTML for the list is finished, plugs it into the nav bar.
  renderNav() { // public: Gets the HTML page for the navigation div and displays it in the nav div, then calls getFile to get the nav details and buildNavBar to display them
    const DOMelement = document.getElementById("navDiv");
    return this.render(DOMelement, "nav")
    .then(function() {
      return this.getFile("nav.JSON", true, "[]");
    }.bind(this))
    .then(function(responseText) {
      this.buildNavBar(responseText);
    }.bind(this));
  }

  showControls() { // public: shows or hides edit button (and any other restricted buttons we create later) depending on the user's permissions
    const content = document.getElementById('contentDiv');
    while (content.previousElementSibling.tagName === "INPUT") {
      content.parentElement.removeChild(content.previousElementSibling);
    }

    this.createRestrictedItem("o_edit", `<input type="button" id="edit" value="Edit" onclick="app.edit(this)">`, content.parentElement, content);
    this.createRestrictedItem("o_comment", `<input type="button" id="leaveComment" value="Leave a comment" onclick="app.comment(this)">`, content.parentElement, content);
    let JSONobj = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
    if (!JSONobj.comments) JSONobj.comments = [];
    if (JSONobj.comments.length > 0) {
      this.createRestrictedItem("o_comment", `<input type="button" id="seeComments" value="See comments" onclick="app.seeComments(this)">`, content.parentElement, content);
    }
  }

  createRestrictedItem(permission, HTML, container, nextSibling) { // public: If the container exists and the user has the required permission, creates a DOM element with the given HTML and adds it to the container (just before nextSibling, if it exists)
      if (container && this.checkPermission(permission)) {
        let item = document.createElement('div');
        container.insertBefore(item, nextSibling);
        item.outerHTML = HTML;

        if (nextSibling) item = nextSibling.previousElementSibling;
        else item = container.lastElementChild;

        item.classList.add("restricted");
      }
    // }
  }

  checkPermission(permission) { // public: returns true if the user has the given permission, false if not
    if (!permission.startsWith("o_")) permission = "o_".concat(permission); // insurance against forgetting to type the prefix
    const loginResult = JSON.parse(sessionStorage.getItem('loginResults'));

    if (loginResult) {
      const origin = window.location.origin;
      let subapp = window.location.pathname.split("/")[1];
      if (!subapp) {
        subapp = "default";
      }

      const thisResource = loginResult.resources.find(res => res.data.l_URL === origin && res.data.s_subApp === subapp)._id;
      const thisPerm = loginResult.permissions.find(perm => thisResource === this.removeDBSuffix(perm.data.k_toID));

      return thisPerm.data.a_defaultAllowedActions.includes(permission);
    }

    return false;
  }

  removeRestrictedItems() { // public: Removes all items with the class name "restricted" (which should be all items that require a permission) from the DOM. Used when logging out.
    const controls = Array.from(document.getElementsByClassName("restricted"));
    controls.forEach(control => {
      control.parentElement.removeChild(control);
    })
  }

  comment(button) { // public: Creates a comment popup - a moveable div with a textbox for the comment title, a textarea for the comment, and "Submit" and "Cancel" buttons
    const commentDiv = this.startDraggableDiv(button, "Comment");
    commentDiv.innerHTML += `
      <table>
        <tr><td>Title</td><td><input id="commentTitle"></td></tr>
        <tr><td>Comment</td><td><textarea id="commentText"></textarea></td></tr>
      </table>`
    this.commentAddButtons(commentDiv);
  }

  startDraggableDiv(button, title) { // private: Creates, positions and returns a DOM element with starting (generic) HTML for a draggable div; the title is displayed in the header and used to generate the div's ID
    // Create the basic comment div
    const dragDiv = document.createElement('div');
    dragDiv.setAttribute("id", `${title.toLowerCase()}Div`);
    dragDiv.classList.add("dragDiv", `${title.toLowerCase()}Div`, "restricted", "popup");
    document.body.appendChild(dragDiv);
    dragDiv.innerHTML = `
      <div id="${title.toLowerCase()}Header" class="dragDivHeader" onmousedown="app.startDragging(this, event)">${title}</div>`;
    const bounds = button.getBoundingClientRect();
    dragDiv.setAttribute("style", `left:${bounds.left + window.scrollX}px; top:${bounds.top + window.scrollY}px`);
    return dragDiv;
  }

  commentAddButtons(commentDiv) { // private: Adds the "Submit" and "Cancel" buttons to the given div.
    const buttonPar = document.createElement('p');
    commentDiv.appendChild(buttonPar);
    buttonPar.outerHTML = `
      <p>
        <input type="button" value="Submit" onclick="app.submitComment(this)">
        <input type="button" value="Cancel" onclick="app.closePopup(this)">
      </p>`;
  }

  submitComment(button) { // public: tries to add the new comment to the page's JSON file and save the result. Updates cache and refreshes on success, alerts the error message on failure.
    const newTitle = document.getElementById("commentTitle").value;
    const newComment = document.getElementById("commentText").value;
    const nowNumber = Date.now();
    const nowText = new Date().toLocaleString();

    let JSONobj = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
    if (!JSONobj.comments) JSONobj.comments = [];
    JSONobj.comments.push({"person":sessionStorage.getItem("username"), "title":newTitle, "comment":newComment, "dateNum":nowNumber, "dateText":nowText});

    const data = {"value":JSON.stringify(JSONobj, null, 4), "page":this.getPage(), "user":sessionStorage.getItem('username')};
    return this.send({"server":"web", "msg":"saveEdit", "data":data})
    .then(function(responseText) {
      if (responseText === "Succeeded") {
        sessionStorage.setItem(`Content/${app.getPage()}/_.JSON`, app.cleanUpWhitespace(JSON.stringify(JSONobj)));
        location.reload();
      }
      else {
        alert(responseText);
      }
    })
  }

  seeComments(button) { // public: Creates a draggable div and adds a table showing all comments for this page. No changes can be made, so the only button is the close button.
    const commentDiv = this.startDraggableDiv(button, "Comment");
    const table = document.createElement('table');
    table.classList.add("stripeTable");
    const tBody = document.createElement("tbody");
    table.appendChild(tBody);
    tBody.innerHTML = `<tr><th>Title</th><th>User</th><th>Date</th><th></th></tr>`;
    commentDiv.appendChild(table);

    let JSONobj = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
    if (!JSONobj.comments) JSONobj.comments = []; // This SHOULD be unnecessary now that the "See comments" button is only visible when comments exist - but it can't hurt.

    JSONobj.comments.forEach(function(comment) {
      tBody.innerHTML += `
        <tr>
          <td>${comment.title}</td>
          <td>${comment.person}</td>
          <td>${comment.dateText}</td>
          <td><input type="button" value="+" onclick="app.toggleComment(this)"></td>
        </tr>
        <tr class="hidden">
          <td colspan="4" class="showWhiteSpace">${comment.comment}</td>
        </tr>`;
    })
    commentDiv.innerHTML += `<input type="button" value="Close" onclick="app.closePopup(this)">`;
  }

  toggleComment(button) { // public: Shows/hides the content of a comment (its title, date and author are always visible). Relies on the structure where comments are shown in a table; one row contains the title, date and author (and clicking it triggers this method), the next contains the content.
    const thisRow = this.getAncestorByAttribute(button, "tagName", "TR");
    const nextRow = thisRow.nextElementSibling;

    if (button.value === "+") {
      nextRow.classList.remove("hidden");
      button.value = "__";
    }
    else if (button.value === "__") {
      nextRow.classList.add("hidden");
      button.value = "+";
    }
    else {
      this.error(`Expand/collapse button's value should be "+" or "__"; is actually ${button.value}`);
    }
  }

  edit(button) { // public: TOC function that calls various other functions to create the edit widget
    // Create the basic edit div
    const editDiv = this.startDraggableDiv(button, "Edit");
    this.addEditSections(editDiv); // Add the main sections - for the template dropdown, the HTML editor(s) and the JSON editor(s)
    const page = this.getPage();
    this.getFileNames("templates").then(function(templates) {
      this.editAddTemplateDropdown(document.getElementById('editDropdownDiv'), templates); // Add template dropdown
      this.editAddJSONSections(document.getElementById('editJSONDiv'), page); // Add the JSON editor(s)
      this.editAddButtons(editDiv); // Add buttons
    }.bind(this)).then(function() {
      this.collapseAll(editDiv); // Start with all collapsible items collapsed
      this.selectTemplate(page, document.getElementById('editDropdownDiv')); // Make sure a template is selected, and show its HTML editor(s)
    }.bind(this));
  }

  addEditSections(editDiv) { // private: Adds the three main sections - template, HTML and JSON - to the edit div.
    editDiv.innerHTML += `
      <div id="editDropdownDiv"></div>
      <div id="editHTMLDiv"><span>HTML <input type="button" idr="expandCollapseHTML" onclick="app.expandCollapse(this)" value="__"></span></div>
      <div id="editJSONDiv"><span>JSON <input type="button" onclick="app.expandCollapse(this)" value="__"></span></div>`;
  }

  getFileNames(path, server="web") { // private: Returns an array of the names of all files in the given folder on the server, assuming it exists
    return this.send({"server":server, "msg":"getFileNames", "data":{"path":path}})
    .then(function(responseText) {
      return Promise.resolve(JSON.parse(responseText));
    })
  }

  editAddTemplateDropdown(editDiv, templates) { // private: Adds a dropdown to the edit widget, allowing the user to choose the template used to create the page
    const page = this.getPage();
    const cache = JSON.parse(sessionStorage.getItem(`Content/${page}/_.JSON`));
    const current = cache.template;
    templates = templates.filter(x => x.endsWith('.html')).map(x => x.slice(0, -5)); // Return templates which end with HTML, but remove the extensions
    const dropdown = document.createElement('select');
    dropdown.setAttribute("id", "templateDropdown");
    dropdown.setAttribute('onchange', 'app.editChangeTemplate(this)');
    editDiv.appendChild(dropdown);

    templates.forEach(template => {
      let selected = "";
      if (template === current) {
        selected = "selected";
      }
      dropdown.innerHTML += `<option value='${template}' ${selected}>${template}</option>`
    });
  }

  editAddJSONSections(JSONDiv, page, template=JSON.parse(sessionStorage.getItem(`Content/${page}/_.JSON`)).template) { // private: Adds a section to the edit div for each JSON viewer on the page, as well as an "Add" button to create more. Viewer sections are created this.buildJSONSection.
    const pageJSON = JSON.parse(sessionStorage.getItem(`Content/${page}/_.JSON`));
    if (pageJSON.JSON) {
      for (let sectionName in pageJSON.JSON) {
        const viewer = pageJSON.JSON[sectionName].viewer;
        if (this[viewer]) {
          JSONDiv.appendChild(this.buildJSONSection(viewer, sectionName, pageJSON.JSON[sectionName]));
        }
        else {
          this.checkJSFile(`JSON_viewers/${viewer}`).then(function() {
            Function(`app.${viewer} = new ${viewer}()`)();
            JSONDiv.appendChild(this.buildJSONSection(viewer, sectionName, pageJSON.JSON[sectionName]));
          }.bind(this));
        }
      } // end for
    }
    const addButton = document.createElement('input');
    JSONDiv.appendChild(addButton);
    addButton.outerHTML = `<input type="button" value="Add JSON section" onclick="app.editAddJSONSection(this)">`;
  }

  editAddJSONSection(button) { // private: Creates a single new JSON section on the page; used to add more JSON viewers to a page
    const JSONDiv = button.parentElement;
    const newJSON = this.buildJSONSection(null, "", []);
    JSONDiv.insertBefore(newJSON, button);
  }

  buildJSONSection(viewer, sectionName, section) { // private: Creates the basics for a JSON editor (dropdown for viewer type, expand/collapse button, delete button, everything that DOESN'T depend on the viewer type), then calls createViewerEdit to fill in the specifics
    const sectionDiv = document.createElement('div');
    sectionDiv.setAttribute("class", "JSONSection");
    sectionDiv.setAttribute("sectionName", sectionName);

    const headerDiv = document.createElement('div');
    sectionDiv.appendChild(headerDiv);
    headerDiv.innerHTML = `
      <input idr="sectionTextBox" value="${sectionName}">
      <input type="button" onclick="app.expandCollapse(this)" value="__">`;

    const mainDiv = document.createElement('div');
    sectionDiv.appendChild(mainDiv);

    const select = document.createElement('select');
    select.setAttribute('idr', "viewerDropdown");
    select.setAttribute('onchange', "app.changeViewer(this)");
    mainDiv.appendChild(select);

    const deleteButton = document.createElement('input');
    mainDiv.appendChild(deleteButton);
    deleteButton.outerHTML = `<input type="button" value="Delete" onclick="app.removeRestore(this, 'JSONSection')">`;

    this.getFileNames('JSON_viewers')
    .then(function(names) {
      names = names.filter(x => x.endsWith(".js")).map(x => x.slice(0, -3)); // return JS files without the .js extension

      if (!viewer) viewer = names[0]; // default to the first viewer

      names.forEach(name => { // Create the dropdown...
        const selected = (name === viewer) ? "selected" : "";
        select.innerHTML += `<option value="${name}" ${selected}>${name}</option>`;
      })

      return this.createViewerEdit(viewer, sectionName, section); // then create the editor
    }.bind(this))
    .then(function(editor) {
      editor.classList.add("JSONViewerEditor")
      mainDiv.appendChild(editor);
      this.collapseAll(editor);
    }.bind(this))

    return sectionDiv;
  }

  changeViewer(dropdown) { // public: When the user chooses a new viewer, updates the edit widget to show an editor for that viewer, rather than the old one
    const viewer = dropdown.value;
    const mainDiv = dropdown.parentElement;
    const sectionDiv = mainDiv.parentElement;
    const sectionName = sectionDiv.getAttribute('sectionName');

    const pageJSON = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
    const data = pageJSON.JSON[sectionName].data;

    const editor = mainDiv.getElementsByClassName('JSONViewerEditor')[0];
    this.createViewerEdit(viewer, sectionName, data)
    .then(function(newEditor) {
      mainDiv.insertBefore(newEditor, editor);
      mainDiv.removeChild(editor);
      this.collapseAll(newEditor);
    }.bind(this))
  }

  createViewerEdit(viewer, sectionName, section) { // private: Makes sure the file for a particular viewer is loaded (it should be), then calls that viewer's edit function to create its editor.
    if (this[viewer]) {
      const newEditor = this[viewer].edit(sectionName, section);
      return Promise.resolve(newEditor);
    }
    else {
      return this.checkJSFile(`JSON_viewers/${viewer}`)
      .then(function() {
        Function(`app.${viewer} = new ${viewer}()`)();
        const newEditor = this[viewer].edit(sectionName, section);
        return Promise.resolve(newEditor);
      }.bind(this));
    }
  }

  removeRestore(button, className) { // public: Adds or removes the "deletedData" class from the button's ancestor. The class name passed in is used to determine which ancestor to add/remove the class from.
    // Get the entry div the button was part of
    const ancestor = app.getAncestorByAttribute(button, "class", className);
    if (button.value === "Delete") {
      ancestor.classList.add("deletedData");
      button.value = "Restore";
    }
    else if (button.value === "Restore") {
      ancestor.classList.remove("deletedData");
      button.value = "Delete";
    }
    else {
      app.error(`Delete/restore button should say "Delete" or "Restore"; actually says "${button.value}"`);
    }
  }

  editAddButtons(editDiv) { // private: Adds the "Save", "Preview" and "Cancel" buttons to the end of the edit widget.
    const buttonPar = document.createElement('p');
    editDiv.appendChild(buttonPar);
    buttonPar.outerHTML = `
      <p>
        <input type="button" value="Save" onclick="app.saveEdit(this)">
        <input type="button" value="Preview" onclick="app.previewEdit(this)">
        <input type="button" value="Cancel" onclick="app.cancelEdit(this)">
      </p>`;
  }

  collapseAll(domElement) { // private: Collapses all collapsible sections inside the given element.
    const closeButtons = domElement.querySelectorAll('input[onclick="app.expandCollapse(this)"]');
    for (let i = 0; i < closeButtons.length; i++) {
      const button = closeButtons[i];
      if (button.value === "__") {
        this.expandCollapse(button);
      }
    }
  }

  selectTemplate() { // private: Makes sure SOMETHING on the template dropdown is selected, then calls editChangeTemplate to show the HTML inputs
    const page = this.getPage();
    const cache = JSON.parse(sessionStorage.getItem(`Content/${page}/_.JSON`));
    const current = cache.template;

    const dropdown = document.getElementById("templateDropdown");
    let options = Array.from(dropdown.children);
    let selected = options.find(x => x.value===current);

    if (!selected) selected = options[0];

    selected.selected = true;
    this.editChangeTemplate(dropdown);
  }

  editChangeTemplate(select) { // public: When the user changes the template in the edit widget, shows/hides HTML edit sections so that only the ones which apply to the selected template are visible.
    const template = select.value;
    const HTMLDiv = document.getElementById('editHTMLDiv');

    return this.getFile(`templates/${template}.html`).then(function(response) {
      const currentSectionNames = this.getTemplateSections(response);
      const oldSections = Array.from(HTMLDiv.getElementsByTagName("SPAN")).filter(x => {const id = x.getAttribute('id'); return id && id.startsWith("edit_HTML_span_")});

      // Permanently hide any old sections that shouldn't be displayed
      oldSections.forEach(function(section) {
        const name = section.getAttribute('id').slice(15); // Remove "edit_HTML_span_"
        if (!(currentSectionNames.includes(name))) {
          section.classList.add('hiddenNoExpand');
        }
      }.bind(this));

      const HTMLButton = app.domFunctions.getChildByIdr(HTMLDiv, "expandCollapseHTML");
      const hidden = (HTMLButton.value === "+") ? "hidden" : "";

      // For all current sections...
      currentSectionNames.forEach(function(name) {
        const section = document.getElementById(`edit_HTML_span_${name}`);
        // If it exists, make sure it's not permanently hidden, and append it to the bottom of the HTML div...
        if (section) {
          section.classList.remove("hiddenNoExpand");
          HTMLDiv.appendChild(section);
        }

        else {
          // If it doesn't exist , create it with a textarea containing the element's value, if any, and show or hide it depending on the state of the HTML expand/collapse button
          const cache = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
          let content = this.getProp(cache, "HTML", name);
          if (!content) content = "";

          HTMLDiv.innerHTML += `
            <span id="edit_HTML_span_${name}" class="${hidden}">
              <p class="editSectionHeader">${name} <input type="button" onclick="app.expandCollapse(this)" value="+"></p>
              <p class="hidden"><textarea class="JSONviewer" id="edit_HTML_${name}" onmouseup="app.resizeAll(this)"></textarea></p>
            </span>`;

            const editArea = document.getElementById(`edit_HTML_${name}`);
            editArea.textContent = content;
        }
      }.bind(this));
    }.bind(this));
  }

  saveEdit() { // public: Saves and displays changes by first saving any files the user has uploaded, then updating and saving the JSON file for the page, then reloading the page.
    this.updatePageJSON()
    .then(function(JSONobj) {
      const data = {"value":JSON.stringify(JSONobj, null, 4), "page":this.getPage(), "user":sessionStorage.getItem('username')};

      this.send({"server":"web", "msg":"saveEdit", "data":data})
      .then(function(responseText) {
        if (responseText === "Succeeded") {
          sessionStorage.setItem(`Content/${app.getPage()}/_.JSON`, app.cleanUpWhitespace(JSON.stringify(JSONobj)));
          location.reload();
        }
        else {
          alert(responseText);
          this.cancelEdit();
        }
      }.bind(this))
    }.bind(this))
  }

  previewEdit() { // public: Previews changes without saving by first updating, but not saving, the JSON file for the page, then rerendering the page content, then calling previewFiles to display any files the user has uploaded (which aren't yet saved).
    const page = this.getPage();
    this.updatePageJSON()
    .then(function(JSONobj) {
      this.renderContent(page, JSON.stringify(JSONobj));
    }.bind(this));
  }

  updatePageJSON() { // public: Updates the JSON object for the page with any changes the user made to the template, HTML or JSON. Returns a promise that resolves with the updated JSON object.
    const HTMLDiv = document.getElementById('editHTMLDiv');
    let JSONobj = JSON.parse(sessionStorage.getItem(`Content/${this.getPage()}/_.JSON`));
    JSONobj.template = document.getElementById("templateDropdown").value;
    JSONobj.HTML = {};

    return this.getFile(`templates/${JSONobj.template}.html`)
    .then(function(response) {
      const HTMLsections = this.getTemplateSections(response);
      HTMLsections.forEach(function(section) {
        const textArea = document.getElementById(`edit_HTML_${section}`);
        if (textArea) {
          JSONobj.HTML[section] = textArea.value;
        }
        else {
          JSONobj.HTML[section] = "";
        }
      })

      JSONobj.JSON = {}; // Make sure this exists, and remove any data that was already there

      const editDiv = document.getElementById('editDiv');
      const JSONSections = Array.from(editDiv.getElementsByClassName('JSONSection'));
      JSONSections.forEach(section => {
        if (!(section.classList.contains("deletedData"))) {
          const viewerSelect = app.domFunctions.getChildByIdr(section, 'viewerDropdown');
          const viewer = viewerSelect.value;
          JSONobj.JSON = this[viewer].update(section, JSONobj.JSON);
        }
      })
      return Promise.resolve(JSONobj);
    }.bind(this));
  }

  cancelEdit() { // public: Cancels editing by hiding the edit widget and rerendering the page without saving or previewing any changes.
    const urlParams = new URLSearchParams(window.location.search);
    let page = urlParams.get('page');
    if (!page) {
      page = 'home'; // default page
    }

    const editDiv = document.getElementById("editDiv");
    document.body.removeChild(editDiv);

    this.renderContent(page);
  }

  startDragging(handle, evnt) { // public: Allows the user to drag an element by marking it as the element being dragged, recording the mouse's last position and adding event listeners to move it when the mouse moves.
    evnt.preventDefault();
    this.dragLastX = evnt.clientX;
    this.dragLastY = evnt.clientY;
    this.dragging = handle.parentElement;

    document.body.setAttribute("onmouseup", "app.stopDragging()");
    document.body.setAttribute("onmousemove", "app.drag(event)");
  }

  drag(evnt) { // public: Fires when the user moves the mouse while dragging something draggable; updates the position of the thing being dragged.
    evnt.preventDefault();

    const dragNewX = this.dragLastX - evnt.clientX;
    const dragNewY = this.dragLastY - evnt.clientY;
    this.dragLastX = evnt.clientX;
    this.dragLastY = evnt.clientY;

    this.dragging.style.top = (this.dragging.offsetTop - dragNewY) + "px";
    this.dragging.style.left = (this.dragging.offsetLeft - dragNewX) + "px";
  }

  stopDragging() { // public: Fires when the user releases the mouse after dragging something; removes the dragging listeners and records that nothing is being dragged.
    document.body.removeAttribute("onmouseup");
    document.body.removeAttribute("onmousemove");
    this.dragging = null;
    this.dragLastX = null;
    this.dragLastY = null;
  }

  removeDBSuffix (idString) { // public: Removes the suffix specifying the database from a GUID, leaving only the actual GUID. Returns the shortened GUID.
  	let newID = idString;
  	if (typeof idString === "string") {
  		const parts = idString.split("_X_");
  		if (parts.length > 1) {
  			parts.pop();
  			newID = parts.join("_X_");
  		}
  	}

  	return newID;
  }

  getFile(fileName, useCache=true, defaultVal="") { // private: Returns the contents of a file, by returning the cached version if it exists, or querying the server if no cached version exists.
    const cache = sessionStorage.getItem(fileName);
    if (cache && useCache) return Promise.resolve(cache);

    else {
      const xhttp = new XMLHttpRequest();

      return new Promise(function(resolve, reject) {
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4) {
            let response = defaultVal;
            if (this.status === 200) {
              response = this.responseText;
            }

            if (useCache) {
              sessionStorage.setItem(fileName, app.cleanUpWhitespace(response));
            }
            resolve(response); // resolve with an empty string
          }
        }

        xhttp.open("GET", fileName);
        xhttp.send();
      });
    }
  }

  buildNavBar(navText) { // private: Builds the navigation header, calling buildNavEntry to get HTML for each specific item.
    const navInfo = JSON.parse(navText);

    // Build HTML for navigation header
    let navHTML = "";
    for (let i = 0; i < navInfo.length; i++) {
      navHTML += this.buildNavEntry(navInfo[i]);
    }

    // Plug HTML into nav bar container
    const navBar = document.getElementById("menu-top-nav");
    if (navBar) {
      navBar.innerHTML = navHTML;
    }
  }

  /*
  Assumes that the listItem ofject has the correct structure:
     "name": the name to show on the nav button, if the corresponding nav button should contain text
     "description", "icon": The icon to show, and the description for screen readers, if the nav button should NOT contain text
     "URL": the URL to link to, if the nav button leads to an outside site
     "HTML": the name of the file to link to, if the nav button leads to another webpage on this site
     "children": an array of objects representing submenu items. Each of these can also have a name, description, URL, HTML and children entry
  Ideally, every entry should contain either a name or a description and icon (not both), and either a URL or an HTML (not both).
  If both ARE present, the name and HTML entries take precedence.
  If neither name nor icon is present, the button is blank.
  If neither HTML or URL is present, the link goes nowhere.

  Generates HTML to display this listItem in the nav menu - there's an <LI> wrapping the whole thing,
  followed by an <A> which links to the specified URL or web page.
  The <A> may just contain a text label, or an icon and screen-reader description.
  Then if the item has children, there's a submenu consisting of a toggle button, an <UL> tag, and the HTML resulting
  from calling this function on each child in turn (each one generates the HTML for its own <LI>).
  */
  buildNavEntry(listItem) { // private: Creates and returns the HTML for a single item on the navigaton list. Calls itself recursively for the item's children, if any.
    let HTML = "";
    let renderThis = !(listItem.beta); // !(listItem.beta) in production mode; always true in beta mode
    if (renderThis) { // If beta is true, this item should only be shown in beta. If it's false or undefined, the item should be shown everywhere.
      // Start the LI wrapper for the entry, and assign its class and ID
      if (listItem.HTML) {
        HTML = `<li id="menu-item-${listItem.HTML}" class="menu-item">`;
      } else {
        HTML = `<li class="menu-item">`;
      }

      let JS = "";
      if (listItem.URL) {
        JS += `window.open('${listItem.URL}', '_blank'); `;
      }
      if (listItem.HTML) {
        JS += `app.goToPage('${listItem.HTML}'); `;
      }
      if (listItem.JS) {
        JS += `${listItem.JS}; `
      }
      if (!(listItem.JS && listItem.JS.startsWith("app.crawlPages("))) {
        JS += `app.recordClick(this); `;
      }

      HTML += `<a onclick="${JS}" data-menu_index=${this.menuIndex++}>`

      // Create label span inside the a element; close tags
      let spanContent = "";
      if (listItem.displayType === "text" || (!listItem.displayType && listItem.name)) { // If we're explicitly told to display text, or we're not told what to display but text is available, display text
        spanContent = listItem.name;
      } else { // Otherwise, display what we're told to display. For the forseeable future, that can only be icons. If we add other display options, we'll need to turn this to elseifs or a switch.
        spanContent += `<i class='icon-2x icon-${listItem.icon}'></i>`;
        if (listItem.description) {
          spanContent += `<span class="fa-hidden">${listItem.description}</span>`;
        }
      }

      HTML += `<span itemprop="name">${spanContent}</span></a>`;

      // If there are children, add a submenu toggle button and a list, and populate it with the children
      if (listItem.children) {
        HTML += `<button class="sub-menu-toggle" aria-expanded="false" aria-pressed="false">
                  <span class="screen-reader-text">Submenu</span></button><ul class="sub-menu">`;
        for (let i = 0; i < listItem.children.length; i++) {
          HTML += this.buildNavEntry(listItem.children[i]);
        }
        HTML += "</ul>";
      }

      // Finally, close the LI tag and return the HTML
      HTML += "</li>";
    }
    return HTML;
  }

  recordClick(button) {
    sessionStorage.setItem("lastMenuIndex", button.getAttribute("data-menu_index"));
  }

  highlightButton(filename) { // public: Transfers the "current-menu-item" class from the old selected button to the one that matches the selected filename.
    if (this.highlightedDOM) {
      this.highlightedDOM.classList.remove("current-menu-item");
    }
    const button = document.getElementById(`menu-item-${filename}`);
    if (button) {
      button.classList.add("current-menu-item");
      this.highlightedDOM = button;
    }
  }

  error(message, err, url, line, col, autogen, alertUser=true) { // public: Logs a Javascript error in this.errors. Should also add an error document to the DB, but this hasn't been tested yet.
  	if (!err) err = new Error();
  	if (!autogen) autogen = false;

    let userMessage = "";
    if (alertUser) {
      userMessage = prompt(`Error: ${message}. This error will be logged. If you would like to add a note or description of the error, please enter it here.`);
    }

  	const record = {
  		"s_message":message,
  		"s_userMessage":userMessage,
  		"s_userName":this.login.userName,
  		"s_DB":this.login.DB,
  		"o_stack":err.stack,
  		"s_url":url,
  		"i_line":line,
  		"i_col": col,
  		"b_Autogenerated":autogen,
  		"s_status":"New"
  	};

  	const time = Date.now();
  	const meta = {"s_type":"error", "d_created":time, "s_schema":"error_2", "k_authorGUID":this.login.userGUID};

  	const doc = {"data":record, "meta":meta};
    return this.send({"server":"web", "msg":"error", "data":JSON.stringify(doc)})
  }

  widget(method, widgetElement, ...args) { // public: Calls the given method on the object representing the given element with the given arguments.
    // args takes all the remaining arguments and stores them in an array
  	// Get the ID of the widget that the DOM element is inside.
  	const id = this.domFunctions.widgetGetId(widgetElement);

  	// If that ID is associated with a widget object which contains the given method...
  	if (id && this.widgets[id] && this.widgets[id][method]) {
  		this.widgets[id][method](widgetElement, ...args); //  Call the method, and pass in widgetElement and any extra args
  	} else {
       // Create an error message. This could stand to be more informative, but I'm not sure how best to write it.
  		 this.error(`App.widget: method ${method} in widget #${id} could not be called.`);
  	}
  }

  getProp(o, ...args) { // public: args is a sequence of properties of an object, o. If o[arg1][arg2][arg3]... exists, returns it. If any property in the chain does not exist, returns null. This prevents errors in situations like calling for this.data[i].data when this.data doesn't exist.
      while (o && args.length > 0) {
          o = o[args.shift()];
      }
      return args.length ? null : o;
  }

  loginOnEnter(evnt) { // public: Takes a keypress event and, if the key pressed was Enter, calls login (enabling a keyboard shortcut)
  	if (evnt.key == "Enter") {
  		return this.login();
  	}
    return Promise.resolve();
  }

  login() { // public: Sends the username and password entered by the user to the server in order to try to log in
  	const username = document.getElementById("userName").value;
  	const password = document.getElementById("password").value;

  	if (!(username && password)) {
  		alert("Enter your username and password first!");
  	}
  	else {
      return this.send({"server":"web", "msg":"login"}, username, password)
      .then(function(responseText) {
        if (["No session", "Bad response from database", "No user", "Multiple users", "No person", "No permission", "More than one permission"].includes(responseText)) {
          alert ("Unable to login. Please try again.");
          return Promise.resolve();
        }
        else { // If the user WAS able to log in, call loginSuccess to do all the stuff that happens when you log in (store permissions, update the DOM, etc.)
          this.loginSuccess(responseText);
        } // end else (response did not indicate failure to log in)
      }.bind(this));
  	} // end else (the user entered a username and password)
  }

  loginSuccess(text) { // private: Runs when the user successfully logs in. Stores the user's permissions, updates the nav menu with subapps they can access, and returns to the previous page.
    const result = JSON.parse(text);
    const resultAttributes = ["DB", "DBs", "serverLocation", "webserver", "subapp", "version"];

    const name = app.getProp(result, "peopleDoc", "data", "s_name");
    sessionStorage.setItem('username', name);

    const GUID = app.getProp(result, "peopleDoc", "_id");
    if (name && GUID) {
      sessionStorage.setItem("userGUID", result.userGUID);
      sessionStorage.setItem("loginResults", text);

      // Get the name of the website (not hardcoded so we can easily change it later)
      let currentLocation = window.location.href;
      if (currentLocation.indexOf('?') > -1) {
        currentLocation = currentLocation.slice(0, currentLocation.indexOf('?'));
      }

      // Update nav to include "harmony" and "logout" options, rather than "login", on menu
      this.loginUpdateNav();

      // Get the history array
      let history = JSON.parse(sessionStorage.getItem("history"));

      // The last entry should be login, and the next-to-last should be where we were before logging in
      const prevPage = history[history.length - 2];

      // Go to the previous page
      window.location.href = `${currentLocation}?page=${prevPage}`;
    } // end if (name and GUID exist)
    else {
    app.error(`Unexpected response from database.
      Response should be an object containing a people node with a data.s_name attribute and a GUID attribute,
      or an error message stating that the user could not be logged in./n/n
      Actual response: ${text}`);
      resolve();
    } // end else (invalid response)
  }

  loginUpdateNav() { // private: Updates the cached nav menu to include the "logout" button, the "edit" button and links to other pages, rather than the "login" button
    const login = JSON.parse(sessionStorage.getItem("loginResults"));
    // Update nav to include "harmony" and "logout" options, rather than "login", on menu
    const nav = JSON.parse(sessionStorage.getItem('nav.JSON'));
    const menu = nav.find(x => x.description === "Menu");
    menu.children = [];

    if (this.checkPermission("edit")) {
      menu.children.push({"name":`Edit menu`, "JS":"app.editMenu(this)", "temp":true});
    }

    const resources = login.resources;
    resources.forEach(resource => {
      let subApp = `${resource.data.s_subApp}/`;
      if (resource.data.s_subApp === "default") subApp = "";
      menu.children.push({"name":resource.data.s_name, "URL":`${resource.data.l_URL}/${subApp}`, "temp":true});
    });

    menu.children.push({"name":`Logout ${name}`, "JS":"app.logout()", "temp":true})
    sessionStorage.setItem("nav.JSON", JSON.stringify(nav));
  }

  editMenu(button) { // public: Creates an edit div for updating the nav menu
    return this.getFile("nav.JSON", false, "[]")
    .then(function(navText) {
      const nav = JSON.parse(navText);
      const editDiv = this.startDraggableDiv(button, "Edit");
      const bounds = button.getBoundingClientRect();

      editDiv.setAttribute("placeholder", 0);
      const table = document.createElement("table");
      editDiv.appendChild(table);

      const left = document.createElement("td");
      left.setAttribute("idr", "left");
      table.appendChild(left);

      const right = document.createElement("td");
      right.setAttribute("idr", "right");
      table.appendChild(right);

      nav.forEach(function(entry) {
        this.editNavEntry(entry, left);
      }.bind(this))

      left.innerHTML += `
        <input type="button" value="Add" onclick="app.addEntry(this)">
        <input type="button" value="Save" onclick="app.saveNavEntries(this)">
        <input type="button" value="Cancel" onclick="app.closePopup(this)">
      `;
      this.collapseAll(editDiv);

      editDiv.setAttribute("style", `left:${bounds.left + window.scrollX - editDiv.offsetWidth}px; top:${bounds.top + window.scrollY}px`);
    }.bind(this))
  }

  editNavEntry(entry, editDiv, successor) { // private: Creates HTML to edit an item on the nav menu, and adds it to the editDiv.
    entry = JSON.parse(JSON.stringify(entry));
    editDiv.insertBefore(this.createNavEditHTML(entry), successor);
  }

  createNavEditHTML(entry) { // private: Given an object describing a menu item, returns HTML for inputs to edit that item and all its children, including deleting the item and adding/deleting children.
    const values = ["name", "icon", "description", "HTML", "URL", "JS"];
    values.forEach(function(value) {
      if (!entry[value]) entry[value] = "";
    })

    let displayText = (entry.displayType === "text" || !(entry.displayType) && entry.name); // If the entry has no explicit display type, default to the name if it exists

    const textChecked = displayText ? "checked" : "";
    const iconChecked = displayText ? "" : "checked";
    const textClass = displayText ? "" : "hiddenNoExpand";
    const iconClass = displayText ? "hiddenNoExpand" : "";
    const display = displayText ? entry.name : entry.description;

    const HTML = `
        <p>
          <span draggable=true ondragover="event.preventDefault()" ondragstart="app.dragEntry(this)" ondrop="app.dropEntry(this)"
          onclick="app.selectDeselect(this)" idr="display_${display}">
            ${display}
          </span>
          <input type="button" onclick="app.expandCollapse(this)" value="__">
          <input type="button" value="Delete" onclick="app.removeRestore(this, 'navEntryEdit')">
        </p>
        <form idr="move_${display}" class="hiddenNoExpand">
          <div class="editSection">
            <p class="editHeader">Display</p>
            <div>
              <input type="radio" name="displayType_${display}" idr="displayText_${display}" value="text" onchange="app.updateOption(this); app.updateDisplay(this)" ${textChecked}> Display Text
              <p class="indent ${textClass}">
                Name: <input idr="name_${display}" value="${entry.name}" onchange="app.updateDisplay(this)">
                The text that will be shown on the menu
              </p>
            </div>
            <div>
              <input type="radio" name="displayType_${display}" idr="displayIcon_${display}" value="icon" onchange="app.updateOption(this); app.updateDisplay(this)" ${iconChecked}> Display Icon
              <p class="indent ${iconClass}">
                Description: <input idr="description_${display}" value="${entry.description}" onchange="app.updateDisplay(this)">
                The description that will be read by screen readers
              </p>
              <p class="indent ${iconClass}">
                Icon:
                <span idr="icon_${display}" class="hiddenNoExpand">${entry.icon}</span>
                <span idr="iconPreview_${display}"><i class='icon-2x icon-${entry.icon}'></i></span>
                <input type="button" value="Choose icon" idr="iconButton_${display}" onclick="app.chooseIcon(this, '${display}')">
                The icon that will appear on the menu
              </p>
            </div>
          </div>
          <div class="editSection">
          <p class="editHeader">Actions</p>
            <p class="indent">
              HTML: <input idr="HTML_${display}" value="${entry.HTML}">
              The page WITHIN this site that this option loads
            </p>
            <p class="indent">
              URL: <input idr="URL_${display}" value="${entry.URL}">
              The EXTERNAL website that this option opens in a new tab
            </p>
            <p class="indent">
              JS: <textarea idr="JS_${display}">${entry.JS}</textarea>
              The javascript that will run when this button is pressed
            </p>
          </div>
        </form>
        <p>Children:</p>
        <div class="indented" idr="children_${display}"></div>`;

    const div = document.createElement("div");
    div.classList.add("navEntryEdit");
    div.setAttribute("idr", `main_${display}`)
    div.innerHTML = HTML;

    let childrenDiv = this.domFunctions.getChildByIdr(div, `children_${display}`);
    if (entry.children) {
      entry.children.forEach(function(child) {
        childrenDiv.appendChild(this.createNavEditHTML(child));
      }.bind(this))
    }
    const add = document.createElement("input");
    childrenDiv.appendChild(add);
    add.outerHTML = `<input type="button" value="Add" onclick="app.addEntry(this)">`;

    return div;
  }

  chooseIcon(button, displayName) { // public: Creates an image gallery of all available icons. Clicking an icon selects it as the icon for the menu item being edited.
    const editDiv = app.getAncestorByAttribute(button, "class", "editDiv");
    const gallery = document.createElement('div');
    gallery.classList.add("imageGallery");
    editDiv.appendChild(gallery);
    const buttonBounds = button.getBoundingClientRect();
    const divBounds = editDiv.getBoundingClientRect();
    gallery.setAttribute("style", `left:${buttonBounds.left - divBounds.left}px; top:${buttonBounds.top - divBounds.top}px`);
    gallery.classList.add("popup");
    gallery.innerHTML = `<div class="iconHolder"><input type="button" value="X" onclick="app.closePopup(this)"></div>`;

    return this.getFile("icons.JSON", true, "[]")
    .then(function(icons) {
      icons = JSON.parse(icons);
      icons.forEach(function(name) {
        gallery.innerHTML += `<div class="iconHolder" onclick="app.selectIcon('${name}', '${displayName}', this)"><i class='icon-2x icon-${name}'></i></div>`;
      }) // end forEach
    }.bind(this)) // end promise chain
  }

  selectIcon(name, ID, button) { // public: Sets the given icon as the icon to display for the menu item being edited, and shows it in the preview area.
    const editDiv = document.getElementById("editDiv");
    const iconName = app.domFunctions.getChildByIdr(editDiv, `icon_${ID}`);
    const iconPreview = app.domFunctions.getChildByIdr(editDiv, `iconPreview_${ID}`);
    iconName.innerHTML = name;
    iconPreview.innerHTML = `<i class='icon-2x icon-${name}'></i>`;

    app.closePopup(button);
  }

  closePopup(button) { // public: Finds the button's first ancestor with the "popup" class and removes it from the DOM.
    const popup = app.getAncestorByAttribute(button, "class", "popup");
    if (popup) {
      popup.parentElement.removeChild(popup);
    }
  }

  /* Assumes the following structure for any group of radio buttons this method is used on:
    One large div (or other DOM element) containing the entire radio group
    Within that large div, multiple smaller divs (or other DOM elements), each representing a single option
    Within each small div, exactly one radio button (the argument for this method) as a direct descendant
  */
  updateOption(button) { // public: See above for required DOM structure. Shows all the children of the div containing the SELECTED button; hides all the children of the other divs except their buttons
    // thisDiv is the div containing elements for one option (such as "text" or "icon", for display types)
    const thisOptionDiv = button.parentElement;

    // allTypeDivs is the larger div containing a div for EACH option in this group
    const allOptionDivs = Array.from(thisOptionDiv.parentElement.children).filter(x => x.tagName === "DIV");

    // Hide all children (other than radio buttons) which only apply to a specific option type...
    allOptionDivs.forEach(div => {
      const children = Array.from(div.children);
      children.forEach(child => {
        if (child.tagName !== "INPUT" || child.type !== "radio") {
          child.classList.add("hiddenNoExpand");
        }
      });
    });

    // Then show the ones that apply to the SELECTED input type
    const children = Array.from(thisOptionDiv.children);
    children.forEach(child => {
      child.classList.remove("hiddenNoExpand");
    });
  }

  updateDisplay(input) { // public: Updates the displayed name of an entry in the nav editor. Runs when the name, display type or description changes, since those are the things the display name depends on. ONLY changes the visible name, not the idrs of DOM elements.
    const ID = input.getAttribute("idr").split("_").slice(1).join("_"); // The idr will be something like name_${ID} or description_${ID}
    const editDiv = app.getAncestorByAttribute(input, "class", "editDiv");

    const name = app.domFunctions.getChildByIdr(editDiv, `name_${ID}`).value;
    const description = app.domFunctions.getChildByIdr(editDiv, `description_${ID}`).value;

    let displayType = document.querySelector(`input[name = "displayType_${ID}"]:checked`).value;
    let displayText = (displayType === "text" || !(displayType) && name); // If the entry has no explicit display type, default to the name if it exists

    const display = displayText ? name : description;
    const displayDOM = app.domFunctions.getChildByIdr(editDiv, `display_${ID}`);
    displayDOM.textContent = display;
  }

  addEntry(button) { // public: Adds a new item to the nav editor, with a placeholder name and no other attributes.
    const editDiv = app.getAncestorByAttribute(button, "class", "editDiv");
    let placeholder = editDiv.getAttribute("placeholder");
    app.editNavEntry({"name":`placeholder${placeholder++}`}, button.parentElement, button);
    editDiv.setAttribute("placeholder", placeholder);
  }

  dragEntry(nameSpan) { // public: Records the nav entry being dragged so it can be dropped later
    this.dragging = this.getAncestorByAttribute(nameSpan, "class", "navEntryEdit");
  }

  dropEntry(nameSpan) { // public: When something is dropped on an entry in a nav editor, if the item being dragged was ALSO a nav entry from the same editor, inserts the item being dragged just above or below the item it was dropped onto.
    const target = this.getAncestorByAttribute(nameSpan, "class", "navEntryEdit");
    const targetEditDiv = this.getAncestorByAttribute(nameSpan, "class", "editDiv");
    const draggingEditDiv = this.getAncestorByAttribute(this.dragging, "class", "editDiv");

    if (targetEditDiv && targetEditDiv === draggingEditDiv) { // If the target and the thing being dragged are both from the same edit div, insert the thing being dragged above or below the target
      if (this.dragging.offsetTop < target.offsetTop) { // drag down
        target.parentElement.insertBefore(this.dragging, target.nextSibling); // Insert after target
      }
      else { // drag up
        target.parentElement.insertBefore(this.dragging, target); // Insert before target
      }
    }

    this.dragging = null;
  }

  selectDeselect(entry) { // public: Runs when the user clicks an entry in the nav editor. If the entry was already selected, deselects it and hides its inputs. If it was not selected, deselects any other entry that was and hides its inputs, then selects the entry that was clicked and shows its inputs.
    const div = this.getAncestorByAttribute(entry, "class", "navEntryEdit");
    const display = div.getAttribute("idr").slice(5);
    const editDiv = document.getElementById("editDiv");
    const right = this.domFunctions.getChildByIdr(editDiv, "right");
    const move = this.domFunctions.getChildByIdr(editDiv, `move_${display}`);

    if (div.classList.contains("selectedItem")) { // If this entry was already selected, deselect it
      move.classList.add("hiddenNoExpand");
      div.classList.remove("selectedItem");
      div.appendChild(move);
    }
    else { // If this entry was NOT already selected, select it and deselect anything else which was selected
      const editDiv = document.getElementById("editDiv");
      const selected = Array.from(editDiv.getElementsByClassName("selectedItem"));
      selected.forEach(this.selectDeselect.bind(this));

      move.classList.remove("hiddenNoExpand");
      move.classList.remove("hidden");
      right.appendChild(move);
      div.classList.add("selectedItem");
    }
  }

  saveNavEntries(button) { // public: Tries to update the JSON file for the nav menu with any changes the user has made. On success, caches the new nav file and reloads to refresh the menu. On failure, alerts the error message.
    const navJSON = [];
    const editDiv = app.getAncestorByAttribute(button, "class", "editDiv");

    // Deselect any selected item first
    const selected = Array.from(editDiv.getElementsByClassName("selectedItem"));
    selected.forEach(this.selectDeselect.bind(this));

    const left = this.domFunctions.getChildByIdr(editDiv, "left");
    const entries = Array.from(left.children).filter(x => x.classList.contains("navEntryEdit"));

    entries.forEach(function(entry) {
      this.updateNavEntry(entry, navJSON);
    }.bind(this))

    const data = {
      "value":JSON.stringify(navJSON, null, 4),
      "user":sessionStorage.getItem('username'),
      "name":"nav",
      "extension":"JSON", // Store the file nav.json
      "folder":"/" // Store in the main folder
    };

    this.send({"server":"web", "msg":"saveEdit", "data":data})
    .then(function(responseText) {
      if (responseText === "Succeeded") {
        sessionStorage.setItem(`nav.JSON`, app.cleanUpWhitespace(JSON.stringify(navJSON)));
        sessionStorage.removeItem("menuList");
        sessionStorage.removeItem("lastMenuIndex");
        this.loginUpdateNav();
        location.reload();
      }
      else {
        alert(responseText);
      }
    }.bind(this))
  }

  updateNavEntry(entry, JSONarray) { // private: Adds an object representing the given menu item to the given array.
    if (entry.classList.contains("deletedData")) return;

    const attributes = ["name", "icon", "description", "HTML", "URL", "JS"];
    const JSONobj = {};
    JSONarray.push(JSONobj);
    const display = entry.getAttribute("idr").slice(5);

    attributes.forEach(function(att) {
      const element = app.domFunctions.getChildByIdr(entry, `${att}_${display}`);
      if (element) {
        if (typeof element.value === "string") JSONobj[att] = element.value;
        else if (typeof element.textContent === "string") JSONobj[att] = element.textContent;
      }
    }.bind(this))
    JSONobj.displayType = document.querySelector(`input[name = "displayType_${display}"]:checked`).value;

    JSONobj.children = [];

    const childrenDiv = app.domFunctions.getChildByIdr(entry, `children_${display}`);
    const children = Array.from(childrenDiv.children).filter(x => x.classList.contains("navEntryEdit"));

    children.forEach(function(child) {
      this.updateNavEntry(child, JSONobj.children);
    }.bind(this))
  }

  logout() { // public: Logs the user out by removing the subapps from the navigation menu, removing their permissions from storage and removing all restricted controls.
    sessionStorage.removeItem("loginResults");
    sessionStorage.removeItem("username");

    // Update nav to include "login" option, rather than "harmony" and "logout", on menu
    const nav = JSON.parse(sessionStorage.getItem('nav.JSON'));
    const menu = nav.find(x => x.description === "Menu");
    menu.children = [
      {"name":"Login", "HTML":"login"}
    ]
    const navText = JSON.stringify(nav);
    sessionStorage.setItem("nav.JSON", navText);
    this.buildNavBar(navText);

    this.removeRestrictedItems();
  }

  // Escapes special characters in a string. Stringifying it and then removing the outer quotes is a good shortcut.
  stringEscape(text) { // public: Escapes special characters in a string
  	let string = JSON.stringify(text);
  	string = string.substring(1, string.length-1);
  	return string;
  }

  isJson(str) { // private: Returns true if a string is JSON, false otherwise. Copied from https://stackoverflow.com/questions/9804777/how-to-test-if-a-string-is-json-or-not
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  getPage() { // public: Returns the name of the current page ("home", "about", etc.)
    const urlParams = new URLSearchParams(window.location.search);
    let page = urlParams.get('page');
    if (!page) {
      page = 'home'; // default page
    }

    return page;
  }

  getTemplateSections(template) { // private: Returns an array of DOM elements in the given template which have a section IDR
    const temp = document.createElement('div');
    temp.classList.add('hidden');
    document.body.appendChild(temp);
    temp.innerHTML = template;
    const sections = Array.from(temp.getElementsByTagName("*")).filter(x => x.hasAttribute('sectionIDR'));
    document.body.removeChild(temp);
    return sections.map(x => x.getAttribute("sectionIDR"));
  }

  submitPerson() {
    const filePath = `Content/${this.getPage()}/_.JSON`;
    const volGUID = app.getProp(JSON.parse(sessionStorage.getItem(filePath)), "other", "volGUID");

    const person = this.buildPersonDoc();
    const invalidPerErr = "Looks like there was a problem saving your information. Please make sure you entered your first and last name and your email address. If you did that and are still having trouble, please contact us.";
    const dupPerErr = "We have more than one person in the system that matches the information you entered, and we don't know which you are. That's probably a glitch, so please contact us and we'll straighten it out.";
    const failPerErr = "Something went wrong when we tried to save your information - please try again, or contact us to resolve the problem.";
    return this.getNode(person, "findPerson", "createPerson", dupPerErr, failPerErr, this.validatePerson, invalidPerErr)
    .then(function(personID) {
      this.personID = personID;
      const link = {"k_fromID":personID, "k_toID":volGUID};
      const dupLinkErr = "There was a problem saving you as a volunteer. Please contact us so we can fix it.";
      const failLinkErr = "There was a problem saving you as a volunteer. Please try again, or contact us so we can fix it.";
      return this.getNode(link, "findInterests", "createInterest", dupLinkErr, failLinkErr);
    }.bind(this))
    .then(function(linkID) {
      this.volLinkID = linkID;
      return this.REST_no_login.db({"function":"findInterests", "k_fromID":this.personID});
    }.bind(this))
    .then(function(interests) {
      this.currentInterests = interests.docs;
      this.markInterests(interests.docs);
      const volDoc = interests.docs.find(x => x.data.k_toID === volGUID);
      this.markAvailability(volDoc);
      document.getElementById('comment').value = app.getProp(volDoc, "data", "s_comment") || "";
      document.getElementById('personDiv').classList.add('hidden');
      document.getElementById('interestsDiv').classList.remove('hidden');
    }.bind(this))
    .catch(err => alert(err));
  }

  buildPersonDoc() {
    const person = {};
    const atts = ["s_nameFirst", "s_nameLast", "l_email"];
    atts.forEach(att => {
      const input = document.getElementById(`${att}Input`);
      if (input.value) person[att] = input.value;
    })

    person.optional = {};
    const optional = ["s_phoneHome", "s_PhoneMobile", "s_Office"];
    optional.forEach(att => {
      const input = document.getElementById(`${att}Input`);
      if (input.value) person.optional[att] = input.value;
    })
    return person;
  }

  getNode(nodeDoc, searchFunc, createFunc, dupErr="Duplicate data", failErr="Creation failure", validateFunc, invalidErr="Invalid data") { // Finds or creates a people doc matching the one given
    if (validateFunc && !(validateFunc(nodeDoc))) return Promise.reject(invalidErr);

    let optional = null; // optional represents data that are not required and don't have to match when searching
    if (nodeDoc.optional) {
      optional = nodeDoc.optional;
      delete nodeDoc.optional;
    }
    // Search for the node, in case it's already in the DB
    return this.checkJSFile('REST_no_login.js')
    .then(function() {
      if (!this.REST_no_login) this.REST_no_login = new REST_no_login();
      nodeDoc.function = searchFunc;
      return this.REST_no_login.db(nodeDoc);
    }.bind(this))
    .then(function(result) {
      const docs = result.docs;
      // If there were multiple matching docs, alert the user to a problem and don't go any farther
      if (docs.length > 1) return Promise.reject(dupErr);

      // If there was a single matching doc, add the optional data (if any) and resolve with its ID
      else if (docs.length === 1) {
        if (optional) {
          optional.ID = docs[0]._id;
          optional.function = "updatePerson";
          this.REST_no_login.db(optional);
        }
        return Promise.resolve(docs[0]._id);
      }

      // If there were no matching docs, create one, and include the optional data (if any)
      else {
        if (optional) {
          Object.keys(optional).forEach(key=> {
            nodeDoc[key] = optional[key];
          })
        }
        nodeDoc.function = createFunc;
        return this.REST_no_login.db(nodeDoc)
        .then(function(result) {
          // If creation went OK, resolve with the new doc's ID
          if (result.ok === true) return Promise.resolve(result._id);

          // Otherwise, alert the user to a problem and don't go any farther
          else return Promise.reject(failErr);
        }.bind(this))
      }
    }.bind(this));
  }

  validatePerson(person) {
    return !!(person.s_nameFirst && person.s_nameLast && person.l_email);
  }

  markInterests(interestDocs) { // Find all the interest checkboxes that represent areas the user has expressed interest in, and check them
    const interestsBoxes = Array.from(document.getElementById("interestsDiv").getElementsByTagName("input")).filter(x => x.type==="checkbox");
    interestsBoxes.forEach(checkbox => {
      const val = checkbox.value;
      const interest = interestDocs.find(x => x.data.k_toID === val);
      if (interest) {
        checkbox.checked = true;
        const textbox = checkbox.nextElementSibling;
        if (textbox && textbox.tagName === "INPUT" && textbox.type === "text") {
          textbox.value = app.getProp(interest, "data", "s_comment") || "";
        }
      }
    })
  }

  markAvailability(volunteerLink) {
    const days = volunteerLink.data.a_availability || [];

    // Get array of available days
    const dayBoxes = Array.from(document.getElementById("availability")
      .getElementsByTagName("input"))
      .filter(x => x.type==="checkbox");

    dayBoxes.forEach(box => {
      if (days.includes(box.value)) box.checked=true;
    })
  }

  submitInterests() {
    const promises = [];

    // Get array of checkboxes for interests, then update interest links
    const gardenBoxes = Array.from(document.getElementById("gardenForm").getElementsByTagName("input")).filter(x => x.type==="checkbox");
    const generalBoxes = Array.from(document.getElementById("generalForm").getElementsByTagName("input")).filter(x => x.type==="checkbox");
    const interestBoxes = gardenBoxes.concat(generalBoxes);
    interestBoxes.forEach(function(checkbox) {
      promises.push(this.updateInterest(checkbox));
    }.bind(this));

    // Get array of available days
    const days = Array.from(document.getElementById("availability")
      .getElementsByTagName("input"))
      .filter(x => x.type==="checkbox")
      .filter(x => x.checked===true)
      .map(x => x.value);

    // Store the availability array in the interest link to the volunteers node
    promises.push(this.REST_no_login.db({"function":"updateInterest", "ID":this.volLinkID, "a_availability":days, "s_comment":document.getElementById('comment').value}));

    // Once all promises resolve, thank the user
    return Promise.all(promises)
    .then(function() {
      document.getElementById('interestsDiv').classList.add('hidden');
      document.getElementById('thankYouDiv').classList.remove('hidden');
    })
    .catch(err => alert("Something went wrong. Please try again or contact us."));
  }

  updateInterest(checkbox) {
    const id = checkbox.value;
    const interest = this.currentInterests.find(x => x.data.k_toID === id);

    // If the checkbox is checked, the user IS interested in this. Make sure their interest link is up to date:
    if (checkbox.checked) {
      // The checkbox may have a textbox after it - if so, that textbox represents a comment on this interest (like a specific response for "Other")
      let comment = null;
      const textbox = checkbox.nextElementSibling;
      if (textbox && textbox.tagName === "INPUT" && textbox.type === "text") comment = textbox.value;

      // If this was NOT already listed in interests, create an interest link (including a comment if applicable)
      if (!interest) {
        return this.REST_no_login.db({"function":"createInterest", "k_fromID": this.personID, "k_toID":id, "s_comment":comment});
      }
      // If it WAS already listed in interests, but it has a comment textbox and the comment has changed, update the interest link
      else if (interest.data.s_comment && interest.data.s_comment !== comment) {
        return this.REST_no_login.db({"function":"updateInterest", "ID":interest._id, "s_comment":comment})
      }
      else return Promise.resolve();
    }
    else if (interest) { // If the checkbox was NOT checked, but WAS listed as an interest, it needs to be removed.
      return this.REST_no_login.db({"function":"deleteInterest", "ID":interest._id});
    }
    else return Promise.resolve();
  }

  resizeAll(textArea) { // public: Resizes all text areas when one is resized
    const width = textArea.getBoundingClientRect().width;
    const textAreas = document.getElementById('editDiv').getElementsByTagName("TEXTAREA");

    for (let i = 0; i < textAreas.length; i++) {
      textAreas[i].style.width = width;
    }
  }

  expandCollapse(button) { // public: Hides all children of the button's GRANDPARENT except for its parent (that way, anything that needs to stay visible can be in the button's parent element)
    const parent = button.parentElement;
    const grandparent = parent.parentElement;
    const children = grandparent.children;

    if (button.value === "__") {
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child !== parent) {
          child.classList.add("hidden");
        }
      }
      button.value = "+";
    }
    else if (button.value === "+") {
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        child.classList.remove("hidden");
      }
      button.value = "__";
    }
  }

  checkJSFile(fileName) { // If the file hasn't yet been requested, creates a promise to get it from the server, and stores the promise in this.optionalFilesLoaded
  	if (!fileName.endsWith('.js')) { // Insurance against forgetting the extension
  		fileName = fileName.concat('.js');
  	}

  	if (!(this.optionalFilesLoaded.hasOwnProperty(fileName))) { // If the promise to load this file doesn't already exist...
  		this.optionalFilesLoaded[fileName] = new Promise(function(resolve, reject) { // create it and store it in this.optionalFilesLoaded
  			const script = document.createElement('script');
  			script.onload = function () { // Load the file...
  				resolve(); // and resolve when it's done
  			}.bind(this); // I know I'm not using "this" at the moment, but I'm tired of getting bitten by it when I add code.
  			script.src = fileName;
  			document.head.appendChild(script);
  		}.bind(this)); // end promise
  	}

  	return this.optionalFilesLoaded[fileName]; // return the promise
  }

  toggleInputFocus(domElement, evnt) { // public: When an input is selected, makes its parent non-draggable. When it's deselected, makes the parent draggable instead.
    const ancestor = this.getAncestorByAttribute(domElement, "draggable");
    switch(evnt.type) {
      case "blur":
      case "mouseout":
        ancestor.draggable = true;
        break;
      case "focus":
      case "mouseover":
        ancestor.draggable = false;
        break;
    }
  }

  getAncestorByAttribute(domElement, att, value) { // public: If no value is passed in, returns the first ancestor that has this attribute; if a value is passed in, returns the first ancestor where the attribute has this value. If no ancestor matches, returns null.
  	let ancestor = domElement;
  	let currentVal = ancestor && (ancestor.getAttribute(att) || ancestor[att]);

  	// Keep walking up the tree as long as the ancestor exists...
  	while (ancestor) {
  		// but stop if we reach a ancestor which has the attribute if no value was given...
  		if (currentVal && !value) break;
  		// or one which has the correct value of the attribute, if one was given...
  		if (currentVal && currentVal === value) break;
  		// including allowing for multiple classes, if the attribute was "class"
  		if (att === "class" && ancestor.classList.contains(value)) break;

      ancestor = ancestor.parentElement;
  		currentVal = ancestor && (ancestor.getAttribute(att) || ancestor[att]);
  	}

  	// When we find a matching ancestor, or run out of ancestors to check, return the ancestor or lack thereof
  	return ancestor;
  }

  uploadFile(file, name, server="pic", path=`Content/${this.getPage()}/images`) { // private: Stores a file. Doesn't actually upload it to the server until the user clicks save.
    return new Promise(function(resolve, reject) {
      const binReader = new FileReader();
      binReader.onload = function(evnt) {
        const fileBinary = new Uint8Array(evnt.target.result);
        const extension = file.name.slice(file.name.lastIndexOf(".") + 1);
        if (!name) {
          name = file.name.slice(0, file.name.lastIndexOf("."));
        }
        name = name.replace(" ", "_"); // replace spaces with underscores

        const obj = {
          "server":server,
          "msg":"upload",
          "path":path,
          "name":name,
          "extension": extension,
          "data":fileBinary};

        return this.send(obj)
        .then(function(responseText) {
          if (responseText === "Succeeded") {
            resolve(`${name}.${extension}`);
          }
          else reject();
        })
      }.bind(this);
      binReader.readAsArrayBuffer(file);
    }.bind(this));
  } // end uploadFile function

  createImageGallery(clickFunc, clickArgs, path=`Content/${this.getPage()}/images`) { // public: Creates a DOM element containing a gallery of all images in the image folder for this page. ClickFunc is the function that will run when an image is clicked on, with the image name as the first argument; clickArgs is all other arguments the function should take.
    const gallery = document.createElement('div');
    gallery.classList.add("imageGallery");

    return this.getFileNames(path)
    .then(function(imageNames) {
      imageNames = imageNames.filter(x => {
        const extension = x.slice(x.lastIndexOf(".") + 1);
        return ["jpg", "jpeg", "png", "bmp"].includes(extension)
      });
      imageNames.forEach(function(name) {
        let clickJS = "";
        if (clickFunc) {
          clickJS = `onclick= "${clickFunc}('${name}'`;
          if (clickArgs) {
            clickJS += `, ${clickArgs}`;
          }
          clickJS += `)"`;
        }
        gallery.innerHTML += `<img src='Content/${this.getPage()}/images/${name}' ${clickJS}>`;
      }.bind(this)) // end forEach
      return Promise.resolve(gallery);
    }.bind(this)) // end promise chain
  }

  send(obj, username="amy", password="") { // private: Sends the given object to the server and returns a promise which resolves with the server's response
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "");  // get ready to send headers

    // set basic authentications
    xhttp.setRequestHeader("Authorization", "Basic "
    + btoa(`${username}:${password}`));

    xhttp.send(JSON.stringify(obj));

    const login = this;

    // After sending the initial request (for a user with the given name and password)...
    return new Promise(function(resolve, reject) {
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          resolve(this.responseText)
        } // end if (readyState and status indicate the response is ready)
      }; // end onreadystatechange function
    });
  }

  listPages(menu=JSON.parse(sessionStorage.getItem("nav.JSON"))) { // public: Builds an array of navigation page entries in order, WITHOUT nesting (in other words, flattens all or part of the hav menu)
    let list = [];
    menu.forEach(function(entry) {
      const store = JSON.parse(JSON.stringify(entry)); // Make a copy, so changes don't affect the original
      delete store.children; // without its children array (the children will be AFTER rather than WITHIN it)
      list.push(store); // Add the menu entry to the list...

      if (entry.children) { // followed by the list of its children (see? Told you)
        list = list.concat(this.listPages(entry.children));
      }
    }.bind(this));

    return list;
  }

  crawlPages(increment=1, page=this.getPage()) { // public: Finds the next/previous page after/before the given page in the menu. NOTE: If there are multiple copies of the same item on the menu, this will always use the first. That means that each individual call to this function will work, but calling it repeatedly will simply loop from the first copy to the second and back, never continuing to the rest of the list.
    let nextIndex = parseInt(sessionStorage.getItem("lastMenuIndex")) + increment;

    const navBar = document.getElementById("navDiv");
    let button = navBar.querySelector(`[data-menu_index="${nextIndex}"]`);
    if (button) {
      button.click();
    }
  }

  pageExists(page=this.getPage()) { // public: Returns true if the given page (or the current page, if none is given) is an option on the nav menu; false if not
    let nav = JSON.parse(sessionStorage.getItem("nav.JSON")); // an array representing top-level menu choices
    let exists = false;

    while (nav.length > 0) { // Process menu items one by one until we run out
      const option = nav.pop(); // Take the first item and check to see if it matches the page
      if (option.HTML === page) {
        exists = true; // If so, we're done
        break;
      }
      else if (option.children) { // If not, make sure any children the item has are added to the list to be checked eventually
        nav = nav.concat(option.children);
      }
    }

    return exists;
  }

  redirectDefault() { // public: redirects to the home page if it exists, or the first top-level menu option with an HTML entry (that is, the first one that goes to a page on this site) otherwise
    let destination = "";

    if (this.pageExists("home")) {
      destination = "home";
    }
    else {
      const nav = JSON.parse(sessionStorage.getItem("nav.JSON"));
      let index = 0;
      while (!destination) {
        destination = nav[index].HTML;
      }
    }

    this.goToPage(destination);
  }

  parseText(text) { // public: Converts its argument to text by returning a blank string if the argument is null or undefined, returning the original text if it's already a string, and stringifying anything else
    if (text === null || text === undefined) return "";
    if (typeof text === "string") return text;
    return JSON.stringify(text);
  }

  phoneFormat(textbox) { // private: A function to format text to look like a phone number, copied and modified from https://stackoverflow.com/questions/30058927/format-a-phone-number-as-a-user-types-using-pure-javascript
    let input = textbox.value;

    // Strip all characters from the input except digits
    input = input.replace(/\D/g,'');

    // Trim the remaining input to ten characters, to preserve phone number format
    input = input.substring(0,11);

    // Based upon the length of the string, we add formatting as necessary. End goal: (x-xxx) xxx-xxxx
    var size = input.length;
    if(size == 0) { // Nothing typed yet
      input = input;
    } else if (size === 1) { // Only one character typed so far
      input = `(${input}`; // Start with the open paren
    } else if(size < 5) { // Typing the area code
      input = `(${input.substring(0,1)}-${input.substring(1,4)}` // Open paren and hypen
    } else if(size < 8) { // Typing the exchange
      input = `(${input.substring(0,1)}-${input.substring(1,4)}) ${input.substring(4,7)}`;
    } else { // Finishing the number
      input = `(${input.substring(0,1)}-${input.substring(1,4)}) ${input.substring(4,7)}-${input.substring(7,11)}`;
    }
    textbox.value=input;
  }
}
