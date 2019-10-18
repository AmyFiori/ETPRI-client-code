class REST_no_login {
  constructor() {
    this.maxTries = 3;
  }

  getRevision(ID) {
    if (!app.cache) {
      app.error("Error: cache missing");
      return null;
    }
    else if (!app.getProp(app.cache, ID, "doc", "_rev")) {
      app.error("Error: Document revision not saved");
      return null;
    }

    else return app.cache[ID].doc._rev;
  }

  db(obj) { // private: Sends ANY request to the database
    const data = obj.data;
    obj.server = "couchDBNoLogin";
    const objStr = JSON.stringify(obj);

    return this.send(objStr)
    .then(function(responseText) {
      if (!app.isJson(responseText)) {
        alert(responseText);
      }
      else {
        const result = JSON.parse(responseText);

        if (result.error) {
          let alertUser = true;
          if (result.error === "too_many_requests") {
            alertUser = false; // These errors happen all the time and we KNOW why - no need to bother the user about them
          }
          app.error (`Error in database call. Request: ${objStr}; Result: ${JSON.stringify(result)}`, new Error(), undefined, undefined, undefined, false, alertUser);
        }

        if (app.isJson(data)) {
          data = JSON.parse(data);
        }

        // If the result has a list of documents, cache and format each one
        if (result.docs) {
          for (let i = 0; i < result.docs.length; i++) {
            this.formatDoc(result.docs[i]);
            if (data) this.formatDoc(data); // just in case we're updating the cache based on data instead (say, if we were saving and therefore the response doesn't actually contain any data because verifying that your save went right is for chumps apparently)
            this.updateCache(result.docs[i], data);
          }
        }
        // If the result is a single document, cache and format it
        else if (result.id || result._id) {
          this.formatDoc(result);
          if (data) this.formatDoc(data); // just in case we're updating the cache based on data instead (say, if we were saving and therefore the response doesn't actually contain any data because verifying that your save went right is for chumps apparently)
          this.updateCache(result, data);
        }

        return Promise.resolve(result);
      } // end else (result was not "Not Logged In")
    }.bind(this));
  }

  send(objStr) { // public: Sends a request to the server
    if (typeof(objStr) !== "string") {
      objStr = JSON.stringify(objStr);
    }

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "");  // get ready to send headers
    xhttp.setRequestHeader("Authorization", "Basic " + btoa("amy:"));

    return new Promise(function(resolve, reject) {
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          resolve(this.responseText);
        }
      }

      xhttp.send(objStr);
    });
  }

  formatDoc(doc) { // private: Ensures consistency by changing "id" to "_id" and "rev" to "_rev"
    // Keep the formatting for id consistent
    if (doc.id) {
      doc._id = doc.id;
      delete doc.id;
    }

    // Keep the formatting for rev consistent
    if (doc.rev) {
      doc._rev = doc.rev;
      delete doc.rev;
    }
  }

  updateCache(doc, data, CRUD) { // private: Updates the cache entry for the document which was queried
    // Cache the document
    if (doc._id) { // Can only cache ANYTHING if we have an ID
      // If we just updated a doc, all its old data were overwritten with the new data which was sent to the DB.
      // If we just created a doc, it needs an all-new entry with the data sent to the DB.
      if (data && (CRUD === "update" || CRUD === "create")) {
        if(!app.cache[doc._id]) {
          app.cache[doc._id] = {};
        }
        app.cache[doc._id].doc = JSON.parse(JSON.stringify(data));
        app.cache[doc._id].doc._rev = doc._rev;
        app.cache[doc._id].doc._id = doc._id;
      }
      // If there was no entry in the cache yet for this ID, and the result actually includes data, create a new cache entry
      else if (!app.cache[doc._id] && doc.data) {
        app.cache[doc._id] = {};
        app.cache[doc._id].doc = JSON.parse(JSON.stringify(doc));
        app.cache[doc._id].doc._rev = doc._rev;
        app.cache[doc._id].doc._id = doc._id;
      }
      else if (app.getProp(app.cache, doc._id, "doc")) { // Otherwise, if there's an existing entry, update it piecemeal - not all queries will have all data
        app.cache[doc._id].doc._id = doc._id;
        if (doc._rev) { // If the result includes a revision, cache it
          app.cache[doc._id].doc._rev = doc._rev;
        }

        if (doc.data) { // If the result includes data, cache the data object
          // make sure the cache has a data object
          if (!app.cache[doc._id].doc.data) {
            app.cache[doc._id].doc.data = {};
          }
          for (let attribute in doc.data) {
            app.cache[doc._id].doc.data[attribute] = doc.data[attribute];
          }
        }
        if (doc.meta) { // same for meta
          if (!app.cache[doc._id].doc.meta) {
            app.cache[doc._id].doc.meta = {};
          }
          for (let attribute in doc.meta) {
            app.cache[doc._id].doc.meta[attribute] = doc.meta[attribute];
          }
        }
      }
    }
    // At the end of updateCache, after ALL changes have been made to app.cache - update the copy in sessionStorage.
    sessionStorage.setItem("cache", JSON.stringify(app.cache));
  }
}
