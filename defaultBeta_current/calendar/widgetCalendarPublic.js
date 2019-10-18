class widgetCalendarPublic extends widgetCalendar {
  constructor(mode) {
    super(null);
    this.mode = mode; // day, week, month or year
    this.eventsByMonth = {};
    this.eventNumber = 1;
  }

  cancelEditEvent() {
    return Promise.resolve();
  } // Empty function because it was simpler to replace this one function than all the functions that called it

  buildHeader() {
    const html =
    `<div class="widget fullWidth" id="${this.widgetID}">
      <div class="widgetHeader">
        <input type="button" class="calendarButton" idr="backButton" value="<" onclick="app.widget('page', this)">
        <input type="button" class="calendarButton" idr="dayButton" value="Day" onclick="app.widget('changeView', this)">
        <input type="button" class="calendarButton" idr="weekButton" value="Week" onclick="app.widget('changeView', this)">
        <input type="button" class="calendarButton" idr="monthButton" value="Month" onclick="app.widget('changeView', this)">
        <input type="button" class="calendarButton" idr="yearButton" value="Year" onclick="app.widget('changeView', this)">
        <input type="button" class="calendarButton" idr="forwardButton" value=">" onclick="app.widget('page', this)">
      </div>
      <div class="widgetBody freezable">
        <div id="calendar${this.widgetID}"></div>
      </div>
    </div>`;

    const newWidget = document.createElement('div'); // create placeholder div
    const parent = document.getElementById('widgets');
    parent.insertBefore(newWidget, parent.firstElementChild) // Insert the new div at the top of the widgets div

    newWidget.outerHTML = html; // replace placeholder with the div that was just written
    this.calendarDOM = document.getElementById(`calendar${this.widgetID}`);
    this.calendarDOM.classList.add("calendarDiv");
    this.widgetDOM = document.getElementById(`${this.widgetID}`);
    this.widgetDOM.classList.add("resizeable");

    this.selectedButton = app.domFunctions.getChildByIdr(this.widgetDOM, `${this.mode}Button`);
    this.selectedButton.classList.add("selectedButton");

    this.refresh();
  }

  refresh() {
    const mainRefresh = super.refresh.bind(this);
    this.getEvents()
    .then(mainRefresh); // apparently can't call super from inside a then, not even if you bind it to this
  }

  addTimeCells(calendar, columns, width, firstDay) {
    super.addTimeCells(calendar, columns, width, firstDay);
    const timeCells = calendar.getElementsByClassName('timeCell');
    for (let i = 0; i < timeCells.length; i++) {
      timeCells[i].removeAttribute("ondblclick");
    }
  }

  showEvent(evntGUID, skipWidth, width, extraHeaderHeight) {
    const evntDiv = super.showEvent(evntGUID, skipWidth, width, extraHeaderHeight);
    evntDiv.removeAttribute("onclick");
    evntDiv.removeAttribute("onmousedown");
  }

  displayMonth(date, table) {
    super.displayMonth(date, table);

    // remove ondblclick (which enabled creating new events) from each day
    const days = table.getElementsByClassName("monthDay");
    for (let i = 0; i < days.length; i++) {
      days[i].removeAttribute("ondblclick");
    }
    // For each event name, replace it with a link to the event's URL, if it has one...
    const events = Array.from(table.getElementsByClassName("eventName"));
    for (let i = 0; i < events.length; i++) {
      if (events[i].URL) { // The URL attribute is the event's URL - if it exists, create a link to it.
        const link = document.createElement("a");
        events[i].parent.insertBefore(link, events[i]);
        link.outerHTML = `<a href="${events[0].URL}" target="_blank">${events[i].textContent}</a>`;
        events[i].parent.removeChild(events[i]);
      }
      else { // Otherwise, just remove the onclick which would enable editing the event
        events[i].removeAttribute("onclick");
      }
    }
  }

  getEvents() {
    const eventPromises = [];
    let month = 0;
    let year = 0;
    switch(this.mode) {
      case 'day':
        month = this.day.getMonth() + 1;
        year = this.day.getFullYear();
        eventPromises.push(this.getMonthEvents(year, month));
        break;
      case 'week':
        const sunday = new Date(this.day);
        sunday.setDate(sunday.getDate() - sunday.getDay()); // This should give the Sunday of the desired week by basically "backing up" until the day is 0 (representing Sunday)
        const sunMonth = sunday.getMonth() + 1;
        const sunYear = sunday.getFullYear();
        eventPromises.push(this.getMonthEvents(sunYear, sunMonth));

        const saturday = new Date(sunday);
        saturday.setDate(saturday.getDate() + 6); // This should give the Saturday of the desired week by adding 6 days to Sunday
        const satMonth = saturday.getMonth() + 1;
        const satYear = saturday.getFullYear();
        if (sunMonth !== satMonth) { // If the week spans two months, get events for both
          eventPromises.push(this.getMonthEvents(sunYear, sunMonth));
        }
        break;
      case 'month':
        month = this.day.getMonth() + 1;
        year = this.day.getFullYear();
        eventPromises.push(this.getMonthEvents(year, month));
        break;
      case 'year':
        year = this.day.getFullYear();
        for (let i = 1; i <= 12; i++) {
          eventPromises.push(this.getMonthEvents(year, i));
        }
        break;
      default:
        app.error(`Calendar mode should be day, week, month or year; actual value is ${this.mode}`);
        break;
    }

    return Promise.all(eventPromises);
  }

  getMonthEvents(year, month) {
    const calendar = this;

    // If the events for this month have already been found, just return a resolved promise
    if(app.getProp(this, "eventsByMonth", year, month)) {
      return Promise.resolve();
    }

    else return new Promise(function(resolve, reject) {
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          if (this.responseText !== "") { // Assuming the file exists and isn't empty (there are events in it)...
            if (!calendar.eventsByMonth) {
              calendar.eventsByMonth = {}; // Create the eventsByMonth object if it doesn't already exist
            }
            if (!(calendar.eventsByMonth[year])) {
              calendar.eventsByMonth[year] = {}; // Create the entry for this year in the eventsByMonth object if it doesn't already exist
            }
            const events = JSON.parse(this.responseText);
            calendar.eventsByMonth[year][month] = events; // Store the list of events for this month in the eventsByMonth object

            for (let i = 0; i < events.length; i++) { // For every event...
              // Give it a "GUID" - an ID number we can identify it by
              events[i].GUID = calendar.eventNumber++;

              // Add it to app.cache
              app.cache[events[i].GUID] = {"doc":{"data":JSON.parse(JSON.stringify(events[i]))}};

              if (events[i].d_date && Date.parse(events[i].d_date)) { // assuming it has a date (it should) and the date can be parsed...
                const parsedDate = Date.parse(events[i].d_date);
                if (!app.getProp(calendar, "eventCache", parsedDate)) { // create the cache of events on this date if it doesn't already exist...
                  calendar.eventCache[parsedDate] = {"events":[], "columns":1};
                }
                calendar.eventCache[parsedDate].events.push({"GUID":events[i].GUID}); // add this event to that array...
              } // end if (date can be parsed)
            } // end for (every event)
          } // end if (the file contains events)
          resolve();
        }
        else if (this.status == 404) { // If the file didn't exist, assume no events for this month
          if (!calendar.eventsByMonth) {
            calendar.eventsByMonth = {};
          }
          if (!(calendar.eventsByMonth[year])) {
            calendar.eventsByMonth[year] = {};
          }
          calendar.eventsByMonth[year][month] = [];
          resolve();
        }
      };

      xhttp.open("GET", `calendar/events_${year}-${month}.JSON`);
      xhttp.send();
    });
  }
}
