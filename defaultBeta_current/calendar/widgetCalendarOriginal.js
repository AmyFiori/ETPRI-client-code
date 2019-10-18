/*
buildHeader() - creates the DOM element for the calendar and positions it on the page. (I want to rewrite this to return the DOM element instead, eventually)
calendarTemplate(dateString, columns) - creates the header for the calendar, including a title, and sets the number of columns
checkToday(day) - returns true if the day passed in is the same day as today; false otherwise
changeView(button) - sets the selectedButton and mode variables (determining which button should be highlighted and how the calendar should be displayed), then refreshes
buildDay(date) - displays the given day on the calendar
buildWeek(date) - displays the week that includes the given day on the calendar
buildMonth(date) - displays the month that includes the given day on the calendar. Calls displayMonth to actually create the display
monthAddEvents(resolutionArray) - IN PROGRESS - adds events to the month view of the calendar

To write: dayAddEvents, weekAddEvents, possibly yearAddEvents. All will get events in the same way as month, but will show them differently.

displayMonth(date, table) - displays the month including the given date in the given table
buildYear(date) - displays the year that includes the given day on the calendar. Calls displayMonth 12 times to actually create the displays
page(button) - moves this.day forward or back by 1 day, 7 days, 1 month or 1 year, depending on the current view, then refreshes
refresh() - Clears the existing calendar and calls buildDay, buildWeek, buildMonth or buildYear to draw a new one
getEvents(year, month) - gets the file "events_${year}-${month}.JSON" and adds all its events to this.eventsByMonth and this.eventsByDate,
  if that file exists. Otherwise, just adds an empty array to this.eventsByMonth to show that the file has been queried

Depends on:
app.widget
app.getProp
app.error
domFunctions.getChildByIdr
domFunctions.widgetGetId
*/

class widgetCalendar {
  constructor(mode) {
    app.widgets[app.idCounter] = this;
    this.widgetID = app.idCounter++;
    this.containedWidgets = [];
    this.calendarDOM = null;
    this.widgetDOM = null;
    this.selectedButton = null;

    this.hourHeight = "30px";
    this.dayWidth = "600px";
    this.labelWidth = "75px";
    this.headerHeight = "50px";
    this.weekWidth = "200px";

    this.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    this.shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this.dayLetters = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
    this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

    this.mode = mode;
    if (!["day", "week", "month", "year"].includes(this.mode)) {
      this.mode = "day"; // default mode, if an invalid mode is passed in
    }

    this.day = new Date();
    this.eventsByMonth = {};
    this.eventsByDate = {};
    this.numColumnsByDate = {};

    const now = new Date();
    this.getEvents(now.getFullYear(), now.getMonth()+1) // Add 1 to the month so it starts counting from Jan = 1 instead of 0
      .then(this.buildHeader.bind(this));
  }

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

  calendarTemplate(dateString, columns) {
    const calendar = document.createElement('table');
    this.calendarDOM.appendChild(calendar);

    const headerRow = document.createElement('tr');
    const headerCell = document.createElement('th');
    headerCell.colSpan = `${columns}`;
    headerCell.setAttribute("height", this.headerHeight);
    const dateDOM = document.createElement('b');
    const dateText = document.createTextNode(dateString);
    dateDOM.appendChild(dateText);
    dateDOM.style.fontSize = "xx-large";
    headerCell.appendChild(dateDOM);
    headerRow.appendChild(headerCell);
    calendar.appendChild(headerRow);
    return calendar;
  }

  checkToday(day) {
    const now = new Date();
    return day.getFullYear()  == now.getFullYear()
        && day.getMonth()     == now.getMonth()
        && day.getDate()      == now.getDate();
  }

  changeView(button) {
    if (this.selectedButton) {
      this.selectedButton.classList.remove("selectedButton");
    }
    button.classList.add("selectedButton");
    this.selectedButton = button;

    switch(button.getAttribute("idr")) {
      case "dayButton":
        this.mode = "day";
        break;
      case "weekButton":
        this.mode = "week";
        break;
      case "monthButton":
        this.mode = "month";
        break;
      case "yearButton":
        this.mode = "year";
        break;
    }
    this.refresh();
  }

  buildDay(date) {
    const day = this.days[date.getDay()];
    const month = this.months[date.getMonth()];
    const dateString = `${day}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
    const calendar = this.calendarTemplate(dateString, 2);

    this.addTimeCells(calendar, 1, this.dayWidth);

    // If the day being displayed is the current day, display current time on the table
    if (this.checkToday(this.day)) {
      this.todayDrawLine(calendar);
    }

    this.getEvents(date.getFullYear(), date.getMonth() + 1)
    .then(function() {
      // Make a Date object representing midnight of this date
      const midnight = new Date(date);
      midnight.setHours(0);
      midnight.setMinutes(0);
      midnight.setSeconds(0);
      midnight.setMilliseconds(0);

      // Use it to check for events on this day
      const events = app.getProp(this, "eventsByDate", midnight.getTime());

      // If there are any events...
      if (events && events.length > 0) {
        const rect = calendar.getBoundingClientRect();
        // Get the width of the first column (which we DON'T want the events overlapping)
        const firstCell = calendar.children[1].children[0]; // First cell in first non-header row
        const cellRect = firstCell.getBoundingClientRect();
        const skipWidth = parseInt(cellRect.width);

        const colWidth = rect.width - skipWidth;
        const numCols = this.numColumnsByDate[midnight.getTime()]; // This should exist, given that there are events on this date
        const evntWidth = colWidth / numCols;

        // For every event...
        for (let i = 0; i < events.length; i++) {
          const colNum = events[i].column;
          const evntSkipWidth = skipWidth + evntWidth*colNum;

          this.showEvent(events[i], evntSkipWidth, evntWidth, calendar);
        } // end for (every event)
      } // end if (there are events today)
    }.bind(this)); // end then
  }

  todayDrawLine(calendar) {
    const rect = calendar.getBoundingClientRect();
    const minutes_in_day = 60*24;
    const pixels_in_table = rect.height - parseInt(this.headerHeight);
    const pix_per_min = pixels_in_table/minutes_in_day;

    const now = new Date();
    const minutes_so_far = now.getHours()*60 + now.getMinutes();
    const minutes_to_go = minutes_in_day - minutes_so_far;
    const pixels_above_bottom = pix_per_min * minutes_to_go; // Calculate how far above the bottom of the table the line representing the time should be

    const testCanvas = document.createElement("canvas");  // Then draw the line
    testCanvas.setAttribute("style", `position:relative; bottom:${pixels_above_bottom}px`);
    testCanvas.setAttribute("height", "20");
    testCanvas.setAttribute("width", rect.width);
    testCanvas.classList.add("unselectable");
    this.calendarDOM.appendChild(testCanvas);
    const ctx = testCanvas.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.strokeStyle = "red";
    ctx.moveTo(0, 0);
    ctx.lineTo(rect.width,0);
    ctx.stroke();
  }

  buildWeek(date) {
    const sunday = new Date(this.day);
    sunday.setDate(sunday.getDate() - sunday.getDay()); // This should give the Sunday of the desired week by basically "backing up" until the day is 0 (representing Sunday)
    const saturday = new Date(sunday);
    sunday.setDate(saturday.getDate() + 6); // This will give the Saturday of the desired week
    const month = this.months[sunday.getMonth()];
    const dateString = `Week of ${month} ${sunday.getDate()}, ${sunday.getFullYear()}`;

    const calendar = this.calendarTemplate(dateString, 8); // Create the table and first row
    const days = document.createElement("tr");
    calendar.appendChild(days);
    const blank = document.createElement("th"); // The row with the days starts with a blank space above the times
    days.appendChild(blank);
    this.weekAddDayCells(days, sunday);
    this.addTimeCells(calendar, 7, this.weekWidth);

    this.getEvents(sunday.getFullYear(), sunday.getMonth()+1)
    .then(function(){
      return this.getEvents(saturday.getFullYear(), saturday.getMonth()+1)
    }.bind(this))
    .then(function() {
      this.weekAddEvents(calendar, sunday);
    });
  } // end method

  weekAddDayCells(row, sunday) {
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(day.getDate() + i); // Move to the correct day of the week
      const dayString = `${this.shortDays[i]} ${day.getDate()}`;
      const dayText = document.createTextNode(dayString);
      const dayCell = document.createElement("th");
      dayCell.setAttribute("class", "weekDayCell");
      dayCell.setAttribute("width", this.weekWidth);
      dayCell.appendChild(dayText);
      row.appendChild(dayCell);

      if (this.checkToday(day)) {  // If the day being displayed is the current day, adjust its formatting
        dayCell.setAttribute("style", "color:yellow; font-weight:bold");
      }
    }
  }

  addTimeCells(calendar, columns, width) {
    for (let i = 0; i< 24; i++) {
      let time = i % 12;
      if (time == 0)
        time = 12;
      let amPM = "AM";
      if (i > 11)
        amPM = "PM";
      const timeslot = document.createElement("tr");
      const timeLabel = document.createElement("td");
      const timeText = document.createTextNode(`${time}:00 ${amPM}`);
      timeLabel.appendChild(timeText);
      timeLabel.setAttribute("width", this.labelWidth);
      timeslot.appendChild(timeLabel);

      for (let j = 0; j < columns; j++) {
        const timeCell = document.createElement("td");
        timeCell.setAttribute("height", this.hourHeight);
        timeCell.setAttribute("width", width);
        timeslot.appendChild(timeCell);
      }
      calendar.appendChild(timeslot);
    }
  }

  weekAddEvents(calendar, sunday) {
    for (let i = 0; i < 7; i++) {
      const colHeader = calendar.children[1].children[i + 1]; // header cell for this column
      const colRect = colHeader.getBoundingClientRect();
      const calendarRect = calendar.getBoundingClientRect();
      let colWidth = parseInt(colRect.width);
      let colHeight = parseInt(colRect.height);
      let skipWidth = colRect.left - calendarRect.left;

      const day = new Date(sunday); // Create a Date object
      day.setDate(day.getDate() + i); // Move to the correct day of the week
      day.setHours(0);
      day.setMinutes(0);
      day.setSeconds(0);
      day.setMilliseconds(0);

      // Use it to check for events on this day
      const events = app.getProp(this, "eventsByDate", day.getTime());

      if (events && events.length > 0) {
        // update colWidth to account for multiple columns - it's the base width divided by this day's number of columns
        const numCols = this.numColumnsByDate[day.getTime()]; // This should exist, given that there are events on this date
        const evntWidth = colWidth / numCols;
        // For every event...
        for (let i = 0; i < events.length; i++) {
          const colNum = events[i].column;
          const evntSkipWidth = skipWidth + evntWidth*colNum;
          // update skipWidth to account for multiple columns - it's the base skip distance plus evntWidth * colNum
          // (so events in column 0 aren't offset at all; ones in column 1 are offset by the width of one event, etc.)
          this.showEvent(events[i], evntSkipWidth, evntWidth, calendar, colHeight);
        } // end for (every event)
      } // end if (there are events)
      // Finally, add the width of this column to skipWidth (so events on the NEXT day will be that much farther over)
      skipWidth += colWidth;
    } // end for (every day of the week)
  }

  showEvent(evnt, skipWidth, width, calendar, extraHeaderHeight) {
    if (!extraHeaderHeight) {
      extraHeaderHeight = 0;
    }
    const rect = calendar.getBoundingClientRect();
    const minutes_in_day = 60*24;
    const pixels_in_table = rect.height - parseInt(this.headerHeight) - extraHeaderHeight;
    const pix_per_min = pixels_in_table/minutes_in_day;

    // Create the div
    const evntDiv = document.createElement("div");
    evntDiv.classList.add("event");

    // calculate the height, and position of the rectangle needed to display the event
    let startTime = this.parseTime(evnt.t_start);
    if (!startTime) {
      startTime = {hours:0, minutes:0}
    }

    let endTime = this.parseTime(evnt.t_end);
    if (!endTime) {
      endTime = {hours:23, minutes:59}
    }

    const minutes_until_start = startTime.hours*60 + startTime.minutes;
    let minutes_to_go = minutes_in_day - minutes_until_start;
    const top_pos = pix_per_min * minutes_to_go; // Calculate how far above the bottom of the table the div should start
    const minutes_until_end = endTime.hours*60 + endTime.minutes;
    minutes_to_go = minutes_in_day - minutes_until_end;
    const bot_pos = pix_per_min * minutes_to_go; // And how far above the bottom of the table the div should end
    const height = top_pos - bot_pos;
    evntDiv.setAttribute("style",
      `position:absolute;
      bottom:${bot_pos}px;
      left:${skipWidth}px;
      width:${width}px;
      height:${height}px;`);
    calendar.appendChild(evntDiv);

    // Add the name and description of the event. Make the name a link to the URL of the event, if there is one
    const namePar = document.createElement("p");
    evntDiv.appendChild(namePar);
    let href = "";
    if (event.l_URL) {
      href=`href="$${evnt.l_URL}" target="_blank"`;
    }

    namePar.innerHTML = `<a ${href}>${evnt.s_name}</a>: `;

    const descPar = document.createElement('p');
    evntDiv.appendChild(descPar);
    descPar.innerHTML = evnt.s_description;

    if (evnt.s_address) {
      const addressPar = document.createElement('p');
      evntDiv.appendChild(addressPar);
      const url = encodeURI(`https://www.google.com/maps/search/?api=1&query=${evnt.s_address}`);
      addressPar.innerHTML = `<a href="${url}" target="_blank">${evnt.s_address}</a>`
    }

    if (evnt.s_location) {
      const locationPar = document.createElement('p');
      evntDiv.appendChild(locationPar);
      locationPar.innerHTML = evnt.s_location;
    }
  }

  buildMonth(date) {
    const dateString = `${this.months[date.getMonth()]} ${date.getFullYear()}`;
    const calendar = this.calendarTemplate(dateString, 7);
    calendar.setAttribute("class", "month");

    this.displayMonth(date, calendar);
  }

  displayMonth(date, table) {
    // Create a new date object with the given date...
    const currentDay = new Date(date);
    // ... but make sure the time is set to midnight (useful for getting events later)
    currentDay.setHours(0);
    currentDay.setMinutes(0);
    currentDay.setSeconds(0);
    currentDay.setMilliseconds(0);

    // Get the day to start on - the Sunday of the week when the month starts
    currentDay.setDate(1);
    currentDay.setDate(1 - currentDay.getDay());

    // Create a header row with days of the week
    const header = document.createElement("tr");
    table.appendChild(header);
    for (let i = 0; i<7; i++) {
      const day = document.createElement("th");
      let dayName = document.createTextNode(this.shortDays[i]);
      if (this.mode === "year") {
        dayName = document.createTextNode(this.dayLetters[i]);
      }
      day.appendChild(dayName);
      header.appendChild(day);
    }

    this.getEvents(date.getFullYear(), date.getMonth()+1)
    .then(function() {
      for (let i = 0; i < 6; i++) { // add a week
        const row = document.createElement("tr");
        table.appendChild(row);
        for (let j = 0; j < 7; j++) { // add a day
          const day = document.createElement("td");
          const dayDiv = document.createElement("div"); // Need a div in order to use scroll bars
          day.appendChild(dayDiv);
          const daySpan = document.createElement('span');
          const dayNum = document.createTextNode(currentDay.getDate());
          daySpan.appendChild(dayNum);
          dayDiv.appendChild(daySpan);
          daySpan.setAttribute("onclick", `app.widget('zoomToDay', this, ${currentDay.getFullYear()}, ${currentDay.getMonth()}, ${currentDay.getDate()})`);

          //formatting
          if (currentDay.getMonth() != date.getMonth()) { // If the day being displayed isn't part of this month
            dayDiv.classList.add("wrongMonth");
          }
          else { // I don't think we should highlight today or show events if we're not even looking at this month.
            if (this.checkToday(currentDay)) {
              dayDiv.classList.add("today");
            }

            // Add events
            const dayMS = currentDay.getTime();
            const events = app.getProp(this, "eventsByDate", dayMS);
            if (events && events.length > 0) { // If there are events on this date
              dayDiv.classList.add("hasEvent");
              if (this.mode === "month") { // If we're building a month for month view, not year view
                for (let i = 0; i < events.length; i++) {
                  const p = document.createElement("p");
                  dayDiv.appendChild(p);
                  if (events[i].l_URL) {
                    const link = document.createElement("a");
                    p.appendChild(link);
                    link.outerHTML = `<a href="${events[i].l_URL}" target="_blank">${events[i].s_name}</a>`;
                  }
                  else {
                    const text = document.createTextNode(events[i].s_name);
                    p.appendChild(text);
                  }
                } // end for (every event)
              } // end if (the calendar is in month mode)
            } // end if (there are events)
          } // end else (this date is in the given month)

          day.id = `${currentDay.getMonth()}-${currentDay.getDate()}-${currentDay.getFullYear()}`; // month-day-year formatting

         //update the day
          currentDay.setDate(currentDay.getDate() + 1);
          row.appendChild(day);
        }
      }
    }.bind(this));
  }

  buildYear(date) {
    const calendar = this.calendarTemplate(date.getFullYear(), 4);

    for (let i = 0; i < 3; i++) { // build a row of months
      const monthRow = document.createElement("tr");
      calendar.appendChild(monthRow);
      for (let j = 0; j < 4; j++) { // build a month
        const monthCell = document.createElement("td");
        monthRow.appendChild(monthCell);
        const monthTable = document.createElement("table");
        monthCell.appendChild(monthTable);
        monthTable.setAttribute("class", "year");

        const monthDate = new Date(date);
        monthDate.setMonth(i*4 + j); // calculate the month to be displayed

        const header = document.createElement("tr"); // Create a header with the name of the month
        const headerCell = document.createElement("th");
        headerCell.setAttribute("colspan", "7");
        headerCell.setAttribute("style", "font-size: large");
        headerCell.setAttribute("onclick", `app.widget('zoomToMonth', this, ${monthDate.getFullYear()}, ${monthDate.getMonth()})`);
        const headerText = document.createTextNode(this.months[i*4 + j]);
        headerCell.appendChild(headerText);
        header.appendChild(headerCell);
        monthTable.appendChild(header);

        this.displayMonth(monthDate, monthTable);
      }
    }
  }

  page(button) {
    let offset = 0;
    if (button.getAttribute("idr") == "backButton") {
      offset = -1; // Add -1 to the day, month or year to go back (or add -7 to the day to go back a week)
    }
    else if (button.getAttribute("idr") == "forwardButton") {
      offset = 1; // Add 1 to the day, month or year to go forward (or add 7 to the day to go forward a week)
    }
    else app.error(`Something other than the forward or back buttons called the "page" method.`);

    if (this.mode == "day") {
      this.day.setDate(this.day.getDate() + offset);
    }
    else if (this.mode == "week") {
      this.day.setDate(this.day.getDate() + offset*7);
    }
    else if (this.mode == "month") {
      const oldMonth = this.day.getMonth();
      let newMonth = oldMonth + offset; // Get the month we SHOULD end up in
      if (newMonth < 0) newMonth += 12;
      if (newMonth > 11) newMonth -= 12;
      this.day.setMonth(this.day.getMonth() + offset);
      while (this.day.getMonth() != newMonth) { // If we ended up in the wrong month, it's got to be because of overshooting the end (say, because we tried to go to Feb. 30 and ended up in March),
        this.day.setDate(this.day.getDate()-1); // so back up until you reach the last day of the right month
      }
    }
    else if (this.mode == "year") {
      this.day.setFullYear(this.day.getFullYear() + offset);
    }

    // after resetting this.day, refresh the widget
    this.refresh();
  }

  zoomToDay(button, year, month, day) {
    if (this.selectedButton) {
      this.selectedButton.classList.remove("selectedButton");
    }
    const dayButton = app.domFunctions.getChildByIdr(this.widgetDOM, "dayButton");
    dayButton.classList.add("selectedButton");
    this.selectedButton = dayButton;

    this.day = new Date(year, month, day);
    this.mode = "day";
    this.refresh();
  }

  zoomToMonth(button, year, month) {
    if (this.selectedButton) {
      this.selectedButton.classList.remove("selectedButton");
    }
    const monthButton = app.domFunctions.getChildByIdr(this.widgetDOM, "monthButton");
    monthButton.classList.add("selectedButton");
    this.selectedButton = monthButton;

    this.day = new Date(year, month);
    this.mode = "month";
    this.refresh();
  }

  refresh() {
    while (this.calendarDOM.lastChild) { // Clear whatever is already in the calendar
      this.calendarDOM.removeChild(this.calendarDOM.lastChild);
    }

    switch (this.mode) { // Call the "build" method for the current mode
      case "day":
        this.buildDay(this.day);
        break;
      case "week":
        this.buildWeek(this.day);
        break;
      case "month":
        this.buildMonth(this.day);
        break;
      case "year":
        this.buildYear(this.day);
        break;
      default:
        app.error(`${this.mode} is not a valid calendar mode (should be day, week, month or year)`);
    }
  }

  getEvents(year, month) {
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
            const eventDates = []; // This array will contain all dates in the current month which have at least one event

            for (let i = 0; i < events.length; i++) { // For every event...
              if (events[i].d_date && Date.parse(events[i].d_date)) { // assuming it has a date (it should) and the date can be parsed...
                const parsedDate = Date.parse(events[i].d_date);
                if (!app.getProp(calendar, "eventsByDate", parsedDate)) { // create the array of events on this date if it doesn't already exist...
                  calendar.eventsByDate[parsedDate] = [];
                }
                calendar.eventsByDate[parsedDate].push(events[i]); // add this event to that array...
                if (!eventDates.includes(parsedDate)) {
                  eventDates.push(parsedDate); // and add the date to the list of dates with events, if it wasn't already on the list
                }
              }
            }

            for (let i = 0; i < eventDates.length; i++) { // Assign columns to the events of every date with events
              calendar.assignEventColumns(eventDates[i]);
            }
          }
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

  assignEventColumns(date) {
    // for (let date in this.eventsByDate) { // For each date with events...
      let maxColumn = 0; // This will be the highest column number we end up using on this date
      for (let i = 0; i < this.eventsByDate[date].length; i++) { // Go through all events on that date, in order.
        const thisEvnt = this.eventsByDate[date][i];
        const thisStart = this.parseTime(thisEvnt.t_start);
        const thisEnd = this.parseTime(thisEvnt.t_end); // Parse the event's start and end times
        let column = 0; // This is the column we're trying to place the event in - start at 0 and increment until a column is found where the event can go
        let available = true; // This is a boolean that marks whether this event can go in a given column
        do {
          available = true; // Reset available - always start by assuming the event CAN go in the column
          // Go through all earlier events
          for (let j = 0; j < i; j++) {
            const otherCol = this.eventsByDate[date][j].column; // Get the column of the other event
            const otherEnd = this.parseTime(this.eventsByDate[date][j].t_end); // parse the earlier event's end time
            // If the other event is in the desired column and ends after the start of this event, they overlap (since we know the other event STARTED before this one)
            if (otherCol == column && (otherEnd.hours > thisStart.hours || otherEnd.hours == thisStart.hours && otherEnd.minutes > thisStart.minutes)) {
              available = false;
              column++;
              break; // No need to keep checking this column once one conflict has been found
            } // end if (there's a conflicting event in this column; move to the next column)
          } // end for (every event which starts earlier than this one; check for conflicting events)
        } while (!available); // Keep going until an available column is found
        // At this point, column is the column in which this event should be shown
        thisEvnt.column = column;
        if (maxColumn < column) { // Update maxColumn if we've just stored a larger column number than we'd seen before
          maxColumn = column;
        }
      } // end for (all events on the given date)
      this.numColumnsByDate[date] = maxColumn + 1; // Store the final value of maxColumn - the number of columns needed for this date
    // } // end for (each date with events)
  }

  // Copied and modified from https://stackoverflow.com/questions/141348/what-is-the-best-way-to-parse-a-time-into-a-date-object-from-user-input-in-javas
  parseTime(t) {
    if (t == null) {
      return null; // If no string was passed in, it can't be parsed - return null
    }

     var d = {};
     /* This regex looks for and remembers:
      one or more digits (stored as time[1])
      a colon (optional),
      two digits (optional, stored as time[2])
      0 or more whitespace characters,
      then a "p", "P", "a" or "A" (optional, stored as time[3])
     */
     var time = t.match( /(\d+)(?::(\d\d))?\s*([pPaA]?)/ );

     /*
     Calculate hours as follows:
     If time[3] doesn't exist (there is no am or pm indication), hours is just time[1].
     If time[3] is "p" or "P", and hours is NOT 12, add 12 to hours
     If time[3] is "a" or "A", and hours IS 12, SUBTRACT 12 from hours
     */
     d.hours = parseInt(time[1]);
     if ((time[3] === "p" || time[3] === "P") && d.hours !== 12) {
       d.hours += 12;
     }
     if ((time[3] === "a" || time[3] === "A") && d.hours === 12) {
       d.hours = 0;
     }

     // And the minutes are equal to time[2] if it exists, and 0 otherwise.
     d.minutes = parseInt( time[2]) || 0;
     return d;
  }
}
