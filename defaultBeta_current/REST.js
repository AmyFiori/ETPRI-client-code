class REST {
  constructor() {
    this.maxTries = 3;
  }

  sendQuery(dataObj, numTries=0) { // public: "Table of contents" function for making a DB query. Resolves with the result of the query.
    let obj = JSON.parse(JSON.stringify(dataObj));
    let promise = Promise.resolve();

    if (obj.CRUD) {
      promise = this.dbCRUD(obj);
    }

    else if (obj.method) {
      promise = this.db(obj.data, obj.message, obj.method);
    }

    return promise
    .then(function(result) {
      // If the result is an object with a rev or _rev attribute, delete it
      delete result.rev;
      delete result._rev;

      // If the result includes a docs attribute (which is an array of such objects), delete _rev from each one
      if (result.docs) {
        for (let i = 0; i < result.docs.length; i++) {
          delete result.docs[i]._rev;
        }
      }

      // Retry if we get a "too many requests" error
      if (result.error === "too_many_requests" && numTries < this.maxTries) {
        return this.sendQuery(dataObj, numTries + 1)
      }
      else if (result.error) {
        return Promise.reject();
      }
      else {
        return Promise.resolve(result);
      }
    }.bind(this));
  }

  dbCRUD(obj) { // private: Sends a CRUD request for a specific document to the database
    let message = obj.message;
    let method = "";

    const CRUD = obj.CRUD;
    delete obj.CRUD;
    const ID = obj._id;
    delete obj._id;

    let rev = "";

    // set method appropriately
    switch (CRUD) {
      case "create":
        method = "post";
        obj._id = ID;
        if (!obj.meta) {
          obj.meta = {};
        }
        obj.meta.k_authorGUID = app.login.userGUID;
        break;
      case "read":
        message = message ? `${ID}/${message}` : ID;
        method = "get";
        break;
      case "update":
        rev = this.getRevision(ID);
        if (!rev) return Promise.reject();
        obj.rev = rev;

        message = message ? `${ID}/${message}` : ID;
        method = "put";
        break;
      case "delete":
        alert("Warning: we shoudln't be deleting!");

        rev = this.getRevision(ID);
        if (!rev) return Promise.reject();
        message = message ? `${ID}?rev=${rev}/${message}` : `${ID}?rev=${rev}`;
        method = "delete";
        break;
      default:
        alert ("Error: invalid CRUD function");
        reject();
    }

    return this.db(JSON.stringify(obj), message, method, CRUD);
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

  db(data, message, method, CRUD) { // private: Sends ANY request to the database
    const objStr = JSON.stringify({
      "server": "couchDB",
      "DB": app.login.DB,
      "message": message,
      "method": method,
      "data":   data});

    return this.send(objStr)
    .then(function(responseText) {
      // The response SHOULD be either JSON which can be parsed, or "Not Logged In"
      if (responseText === "Not Logged In") {
        if (app.login.loggedIn === true) { // This should prevent multiple "Not Logged In" alerts - as soon as the first triggers, loggedIn flips to false
          alert ("Your session has timed out");
          app.login.logout();
        }
        return Promise.resolve({"docs":[]});
      }
      // If it's not "Not Logged In", try to parse it
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
            this.formatDoc(data); // just in case we're updating the cache based on data instead (say, if we were saving and therefore the response doesn't actually contain any data because verifying that your save went right is for chumps apparently)
            this.updateCache(result.docs[i], data, CRUD);
          }
        }
        // If the result is a single document, cache and format it
        else if (result.id || result._id) {
          this.formatDoc(result);
          this.formatDoc(data); // just in case we're updating the cache based on data instead (say, if we were saving and therefore the response doesn't actually contain any data because verifying that your save went right is for chumps apparently)
          this.updateCache(result, data, CRUD);
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
  }
}
