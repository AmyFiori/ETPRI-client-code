/*
widgetCalendar class: Runs a widgetCalendar widget

The widgetCalendar widget displays a calendar and events. The user can add, edit and delete events, and can
view any day, week, month or year with all events marked. Under specific circumstances (if the user is viewing
a calendar which can be published, and has permissions allowing publication), they can publish one or more months
of the calendar, which means creating a JSON file for each month and storing them in a folder where they may be
accessed by another site.

---------------------------------Unit tests-------------------------------------
# | Action                              | Expected result
--------------------------------------------------------------------------------
***********************************NAVIGATION***********************************
--------------------------------------------------------------------------------
1 | Open the calendar search table. If  | At least one calendar should appear
  | there are no calendars on it, click | in the calendar search table
  | "Add" and create a new calendar in  |
  | the dataBrowser that appears, then  |
  | search in the table again.
--------------------------------------------------------------------------------
2 | Click on a calendar in the table    | The calendar should open in day mode,
  |                                     | showing the current day
--------------------------------------------------------------------------------
3 | Click the > arrow                   | The calendar should advance to the next day
--------------------------------------------------------------------------------
4 | Click the < arrow                   | The calendar should retreat to the previous day
--------------------------------------------------------------------------------
5 | Click the Week button               | The calendar should switch to week view,
  |                                     | and should show the week which contains
  |                                     | the day you were previously viewing. If
  |                                     | the current day is included in the week
  |                                     | you're viewing, its date should be printed
  |                                     | in yellow instead of white.
--------------------------------------------------------------------------------
6 | Click the > arrow                   | The calendar should advance to the next week
--------------------------------------------------------------------------------
7 | Click the < arrow                   | The calendar should retreat to the previous week
--------------------------------------------------------------------------------
8 | Click the Month button              | The calendar should switch to month view,
  |                                     | and should show the month which contains
  |                                     | the day you were originally viewing. If
  |                                     | any dates on the calendar contain events,
  |                                     | they should appear yellow instead of gray.
  |                                     | If the current day is included in the given
  |                                     | month, its number should appear red instead
  |                                     | of black.
--------------------------------------------------------------------------------
9 | Click the > arrow                   | The calendar should advance to the next month
--------------------------------------------------------------------------------
10| Click the < arrow                   | The calendar should retreat to the previous month
--------------------------------------------------------------------------------
11| If the shown month starts on Sunday,| Nothing special should happen, but this is
  | move to a month that doesn't.       | important for steps 12 and 13
--------------------------------------------------------------------------------
12| Click the narrow gray bar to the    | The calendar should switch to week view,
  | left of the first week of the month | and should show the week you clicked on
  | (the one that starts in the         | (the one that starts in the previous month
  | previous month)                     | and ends in the month you were viewing)
--------------------------------------------------------------------------------
13| Click the Month button              | The calendar should return to the month
  |                                     | you were on in step 11 (NOT the month
  |                                     | which began the week you were on in step 12)
--------------------------------------------------------------------------------
14| Click the Year button               | The calendar should switch to year view,
  |                                     | and should show the year which contains
  |                                     | the month you were viewing in step 13. If
  |                                     | any dates in the year contain events, they
  |                                     | should appear yellow instead of gray. If
  |                                     | the current date is included in the year,
  |                                     | its number should be red instead of black.
--------------------------------------------------------------------------------
15| Click the > arrow                   | The calendar should advance to the next year
--------------------------------------------------------------------------------
16| Click the < arrow                   | The calendar should retreat to the previous year
--------------------------------------------------------------------------------
17| Click the name of a month in the    | The calendar should switch to month view
  | calendar                            | and show the month you clicked on
--------------------------------------------------------------------------------
18| Click the number of a day in the    | The calendar should switch to day view
  | calendar                            | and show the day you clicked on
--------------------------------------------------------------------------------
19| Return to year view and click the   | The calendar should switch to day view
  | number of a day in the calendar     | and show the day you clicked on
--------------------------------------------------------------------------------
************************************CREATING************************************
--------------------------------------------------------------------------------
1 | In day view, double-click on an     | A green event div should appear on that
  | hour                                | hour. The details div on the right should
  |                                     | open if it wasn't already open, and
  |                                     | it should show details for the new event.
  |                                     | The name should default to "New Event",
  |                                     | the date to the day you're viewing,
  |                                     | the start time to the hour you clicked,
  |                                     | and the end time to an hour later.
--------------------------------------------------------------------------------
2 | Click the Add button in the details | The green event div should turn
  | div                                 | blue (meaning it is selected but not
  |                                     | new), and the Add button should change
  |                                     | to a Save button
--------------------------------------------------------------------------------
3 | Switch to week view                 | The event should still be visible on
  |                                     | the day you added it to, but should
  |                                     | not be selected
--------------------------------------------------------------------------------
4 | Double-click any hour cell          | A green event div should appear as in step
  |                                     | 1, with the date and time equal to the day
  |                                     | and hour you double-clicked.
--------------------------------------------------------------------------------
5 | Click the Add button                | The event div should turn blue as in step 2
--------------------------------------------------------------------------------
6 | Select the event                    | The event should turn from yellow (not
  |                                     | selected) to blue (selected). There
  |                                     | should be a "Duplicate" button in the
  |                                     | details div
--------------------------------------------------------------------------------
7 | Click the Duplicate button          | A new event should appear (in a green
  |                                     | div) which is identical to the one you
  |                                     | duplicated. They should appear side-by-
  |                                     | side in separate columns.
--------------------------------------------------------------------------------
8 | Click the Add button in the details | An alert should appear warning you that
  | div                                 | an identical event already exists and
  |                                     | asking if you want to create the new one
--------------------------------------------------------------------------------
9 | Click "ok" in the alert to agree    | The new event should turn blue (selected)
  | to create the new event             | instead of green (new), and the "Add" button
  |                                     | should become a "Save" button
--------------------------------------------------------------------------------
10 | Repeat steps 7-8, and when the      | The new event should remain green and the
  | alert appears, click "cancel" to    | "Add" button should not change
  | prevent creating the new event      |
--------------------------------------------------------------------------------
11| Change the date of the event to a   | The event div should move to the new day
  | different day in the same week.     |
--------------------------------------------------------------------------------
12| Click the Add button                | The event should be saved without the alert,
  |                                     | since it's no longer identical to an
  |                                     | existing event.
--------------------------------------------------------------------------------
13| Switch to month view and double-    | The cell should turn green and the text
  | click on a date cell                | "New event" should appear in it. The
  |                                     | details div should open with the event's
  |                                     | details as always when creating an event.
  |                                     | The default start time should be noon.
--------------------------------------------------------------------------------
14| Click the Add button                | The month cell should turn blue instead of
  |                                     | green, and the Add button should become a
  |                                     | Save button as usual
--------------------------------------------------------------------------------
15| Repeat steps 13 and 14 in year view | The cell should change color as in month
  |                                     | view, but no text should appear. The
  |                                     | details div should open with the new
  |                                     | event's details exactly as in month view.
--------------------------------------------------------------------------------
*****************************SELECTING AND EDITING******************************
--------------------------------------------------------------------------------
1 | In day view, select an event        | The event should be selected
--------------------------------------------------------------------------------
2 | Enter new values for the start and  | As the start and end times change,
  | end times of the event              | the green event div on the calendar should
  |                                     | move and resize, so that its top is always
  |                                     | at the given start time and its bottom
  |                                     | is always at the given end time.
--------------------------------------------------------------------------------
3 | Click on the top of the selected    | The top of the div should move as you drag,
  | event div, drag up or down and      | and when you release the mouse, the time
  | release the mouse button            | in the details div should update the start
  |                                     | time to the time you dragged to, rounded
  |                                     | to the nearest 15 minutes
--------------------------------------------------------------------------------
4 | Click on the bottom of the selected | The bottom of the div should move as you drag,
  | event div, drag up or down and      | and when you release the mouse, the time
  | release the mouse button            | in the details div should update the end time
  |                                     | to the time you dragged to, rounded to the
  |                                     | nearest 15 minutes
--------------------------------------------------------------------------------
5 | Enter a new value for the date of   | The calendar should switch to showing
  | the event                           | the new day, and the event should remain
  |                                     | visible
--------------------------------------------------------------------------------
6 | Enter a new value for the URL of    | If it wasn't already, the event name
  | the event.                          | in the event div should become a link
--------------------------------------------------------------------------------
7 | Click the event name in the div     | The page with the URL you entered
  |                                     | should appear in a new tab
--------------------------------------------------------------------------------
6 | Enter a new value for the address   | The address you entered should appear
  | of the event.                       | in the event div (replacing the previous)
  |                                     | address, if there was one) as a link
--------------------------------------------------------------------------------
7 | Click the address in the div        | Google Maps should open in a new tab,
  |                                     | and search for the address you entered.
--------------------------------------------------------------------------------
8 | Click the Save button, then click   | The event should be deselected but
  | away from the event (elsewhere in   | all your changes should remain.
  | the calendar table)                 |
--------------------------------------------------------------------------------


Select another event
Change its time by typing
Click away from the event
Switch to week view
Select an event
Change its date
Click away from the event
Select an event
Change its date
Cancel
Switch to month view
Select an event
Click away from the event
Zoom to or create a day with multiple events
Adjust times so the events overlap
Adjust times so the events don't overlap
***********************************PUBLISHING***********************************
Log in as admin
View the public calendar
Add an event
Click Publish
Look for JSON file



//PUBLIC

changeView(button) - sets the selectedButton and mode variables (determining which button should be highlighted and how the calendar should be displayed), then refreshes
toggleWidgetDetails(button) - shows or hides the details panel
page(button) - moves this.day forward or back by 1 day, 7 days, 1 month or 1 year, depending on the current view, then refreshes
zoomToDay(button, year, month, day) - zooms in to the given day (changes the calendar to day mode and sets the date to that day)
zoomToMonth(button, year, month) - zooms in to the given month (changes the calendar to month mode and sets the month to that month)
addEvent(cell) - creates a new event, starting at the top of the cell (which was double-clicked to create the event)
viewEvent(div) - selects an event and shows its details in the details sidebar
deselectAll(calendar, evnt) - calls cancelEditEvent to deselect any selected div, only on a single click. Nearly all the logic here is devoted to NOT triggering cancelEditEvent on a double-click.
linkEvent(data) - links the just-saved event to the calendar and refreshes to display it
cancelEditEvent(button) - Removes a new event or deselects an old one without saving changes; refreshes the calendar
duplicate(button) - creates a new node with the same details as the node which was selected
updateDetails(input, GUID) - Updates the new or selected event's details, then refreshes to show the change
keypressed(evnt) - handles keypress events (at the moment, the only keypress event of interest is hitting Delete to remove an event)
publish(button) - Updates the JSON file(s) representing the month(s) of the day, week, month or year being viewed. These files are used to populate the calendar on the main web page.

// PRIVATE

buildHeader() - creates the DOM element for the calendar and positions it on the page. (I want to rewrite this to return the DOM element instead, eventually)

refresh() - Clears the existing calendar and calls buildDay, buildWeek, buildMonth or buildYear to draw a new one
calendarTemplate(dateString, columns) - creates the header for the calendar, including a title, and sets the number of columns
checkToday(day) - returns true if the day passed in is the same day as today; false otherwise

buildDay(date) - displays the given day on the calendar
todayDrawLine(calendar) - draws the red line on the day view of the current day which indicates the current time

buildWeek(date) - displays the week that includes the given day on the calendar
weekAddDayCells(row, sunday) - adds the header cells at the top of the week view which show the days
addTimeCells(calendar, columns, width) - adds the main part of day or week view - a table in which each row is an hour and each column is a day
weekAddEvents(calendar, sunday) - for each day in a week, gets the list of events (from eventCache - NOT from the DB), calculates the event's horizontal position and passes it to showEvent
showEvent(evnt, skipWidth, width, extraHeaderHeight) - Displays an event on the calendar

buildMonth(date) - displays the month that includes the given day on the calendar. Calls displayMonth to actually create the display
displayMonth(date, table) - displays the month including the given date in the given table
buildYear(date) - displays the year that includes the given day on the calendar. Calls displayMonth 12 times to actually create the displays

getEvents() - TOC function that gets the list of all events related to this calendar and stores them in this.eventCache

assignEventColumns(date) - determines the number of columns needed to show all events and which column each event should be in
compareStartTimes(a,b) - comparison function for ordering events by start time
insertNewEvent(eventList) - given a list ordered by start times, inserts this.newEvent in its proper place
checkColumn(i, column, todayEvents) - given a list of events, the position of the event in question and a column, determines whether that event can go in that column

showEventDetails(evntGUID, date) - shows the details of the new or selected event in the details panel

startDrag(div, evnt) - Fires when the user clicks on the selected event div - sets listeners that resize the div when the mouse is moved
resize(calendar, evnt, bottom) - Fires when the user moves the mouse while dragging an event div - resizes the div
doneResizing(calendar, evnt, bottom) - Fires when the user releases the mouse after dragging an event div - updates the event time and refreshes the calendar
deleteKey() - Runs when the Delete key is pressed. Removes the new or selected event, if there is one, from the calendar. If it was a selected event (one that was already saved), it is NOT trashed - only the link to the calendar is removed.
unlinkSelectedEvent() - removes the selected event from the calendar. Does NOT delete the selected event, only its link to the calendar.

parseTime(t) - parses a string that represents a time and returns an object containing the hours and minutes (e.g., "11:30 PM" will return {hours:23, minutes:30})
convert24HrToAMPM - given an object containing "hours" between 0 and 23 and "minutes" between 0 and 59, returns an object with an "hour" between 1 and 12, the same minutes and an "AMPM" of either "AM" or "PM"
*/

class widgetCalendar {
  constructor(GUID) {
    this.GUID = GUID; // The ID of the calendar node in the database

    this.mode = "day"; // this.mode determines whether the calendar shows a day, week, month or year. Day is the default for now. Eventually users will be able to set their own defaults and save them.

    this.day = new Date();      // this.day is the date shown on the calendar. It starts equal to the current day when the calendar is opened.
    this.day.setHours(0);       // It will never be necessary to extract a time from this.day, and setting the time to midnight will make some later logic easier.
    this.day.setMinutes(0);
    this.day.setSeconds(0);
    this.day.setMilliseconds(0);

    /* These variables store the events for every day seen so far, and the number of columns needed to show them.
      Combined future example:
      {
        "March 25, 2019": {"events":[], "columns":1},
        "March 26, 2019": {"events":[{"GUID":"1324-12341234-12341234-1234", "column":0},{"GUID":"4567-45674567-45674567-4567", "column":1}], "columns":2}
      }

      Note: actual keys are parsed dates (looking like "1551416400000") rather than human-readable dates (looking like "March 01, 2019")
    */
    this.eventCache = {};     // Each key is a parsed date. Each value is an array of events, where each event is an object containing a string "GUID" and an int "column".

    // Lists of names, which should all be self-explanatory
    this.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; // Used in day view
    this.shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Used in week and month view
    this.dayLetters = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]; // Used in year view
    this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; // Used in all views
    // this.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]; // Not currently used

    this.widgetID = app.idCounter; // The ID of the widget on the page
    this.containedWidgets = []; // The array of other widgets contained in this one; used for cleanup when closing
    this.details = null;        // The widgetDetails instance shown in the details pane

    // DOM elements - all will be assigned after the widget is built
    this.widgetDOM = null;      // The div which contains the entire widget, including header and details div
    this.detailsPane = null;    // The div which contains the widgetDetails for the calendar or selected event
    this.calendarDOM = null;    // The TD which contains the calendar table and any canvas elements
    this.calendarTable = null;  // The calendar table itself
    this.selectedButton = null; // The button - day, week, month or year - representing the current view

    // Sizing variables - here because I sometimes do math with them (using one item's height to calculate another's position,
    // for instance), which I couldn't easily do if they were in CSS.
    this.headerHeight = "50px"; // Height of the main header at the top of the calendar
    this.hourHeight = "30px";   // Height of an hour in day and week mode
    this.dayWidth = "600px";    // Width of an hour (so approximate width of the calendar) in day mode
    this.weekWidth = "200px";   // Width of a day in week mode
    this.labelWidth = "100px";   // Width of the time label cells (the ones that say "12:00 AM", "1:00 AM", etc.) in day and week mode

    // Variables for drag-to-resize (or drag-to-reschedule, since the size and position of an event correspond to its start and end times)
    this.mousePos = null;       // Last known vertical mouse position when dragging
    this.dragOffset = 10;       // Distance a mousedown may be from the edge of a div and still drag it
    this.minutesToRound = 15;   // Amount to round the time the user drags the start or end of an event to

    this.name = "Untitled calendar"; // Temporary name to use in case we can't find the correct one
    this.nodeLabel = "calendar";
    if (app.metaData) {
      this.nodeLabel = app.metaData.getNode('calendar').nodeLabel; // The user's label for calendar nodes. Appears in the sidebar widget list.
    }

    this.selectedEvent = null;  // An object representing the currently-selected EXISTING event, if there is one. Starts as a copy of that event's cache file. Updates as the user changes the event.
    this.newEvent = null;       // An object representing the currently-selected NEW event, if there is one. Starts with the name "New Event", date and time based on where the user clicked, and no other attributes. Updates as the user changes the event.

    this.deselectTimer = null;  // Used to determine whether a click is part of a double-click (in which case we don't want to call deselectAll) or a single-click (in which case we do).
    this.requests = []; // Used by REST to track requests made by this widget.

    app.widgets[app.idCounter] = this;
    this.getEvents()
      .then(this.buildHeader.bind(this));
  }

  // Public functions
  changeView(button) {
    this.cancelEditEvent() // If an event was being edited, stop editing it
    .then(function() {
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
    }.bind(this));
  }

  toggleWidgetDetails(button) {
    if (button.value == "Show Details") {
      this.detailsPane.classList.remove("hidden");
      button.value = "Hide Details";
    }
    else {
      this.detailsPane.classList.add("hidden");
      button.value = "Show Details";
    }

    this.refresh(); // Need to move any event divs since the width of the calendar has changed
  }

  page(button) {
    this.cancelEditEvent() // If an event was being edited, stop editing it
    .then(function() {
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
    }.bind(this));
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

  zoomToWeek(control, year, month, day) {
    if (this.selectedButton) {
      this.selectedButton.classList.remove("selectedButton");
    }
    const weekButton = app.domFunctions.getChildByIdr(this.widgetDOM, "weekButton");
    weekButton.classList.add("selectedButton");
    this.selectedButton = weekButton;

    this.day = new Date(year, month, day);
    this.mode = "week";
    this.refresh();
  }

  zoomToMonth(button, year, month) {
    if (this.selectedButton) {
      this.selectedButton.classList.remove("selectedButton");
    }
    const monthButton = app.domFunctions.getChildByIdr(this.widgetDOM, "monthButton");
    monthButton.classList.add("selectedButton");
    this.selectedButton = monthButton;

    this.day = new Date(year, month, 1);
    this.mode = "month";
    this.refresh();
  }

  addEvent(cell, data) {
    if (!data) {
      data = {};
    }

    // Make sure any times that are passed in are parsed
    if (data && data.t_start && !(data.t_start.hours && data.t_start.minutes)) {
      data.t_start = this.parseTime(data.t_start);
    }
    if (data && data.t_end && !(data.t_end.hours && data.t_end.minutes)) {
      data.t_end = this.parseTime(data.t_end);
    }

    let startHours = 12;
    if (cell && cell.getAttribute("hour")) {
      startHours = parseInt(cell.getAttribute("hour"));
    }
    const endHours = startHours + 1;

    // Set the date and time for the new event, if they weren't already given
    this.newEvent = JSON.parse(JSON.stringify(data));

    this.newEvent = {
      "s_name":data.s_name    || "New Event",
      "d_date":data.d_date    || cell.getAttribute("date"),
      "t_start":data.t_start  || {"hours":startHours,"minutes":0},
      "t_end":data.t_end      || {"hours":endHours,"minutes":0},
      "column":0
    }
    // If the end time would be midnight, make it 11:59 instead, so as not to cross into the next day
    if (this.newEvent.t_end.hours == 24) {
      this.newEvent.t_end.hours = 23;
      this.newEvent.t_end.minutes = 59;
    }

    this.selectedEvent = null;
    return this.showEventDetails(null); // will show details for a new event (without a GUID)
  }

  viewEvent(control) {
    const GUID = control.getAttribute('GUID');
    this.selectedEvent = JSON.parse(JSON.stringify(app.cache[GUID].doc));
    this.newEvent = null;

    return this.showEventDetails(GUID);
  }

  deselectAll(calendar, evnt) {
    if (!evnt.target.classList.contains('event')) { // If the click was NOT on event div (if it was on a div, we let the div handle it through viewEvent)
      if(this.deselectTimer) { // If there was a deselect timer already waiting (that is, the user already clicked once)
        clearTimeout(this.deselectTimer); // cancel it and don't start another; this was a double-click
        this.deselectTimer = null;
      }
      else { // If there was NOT a deselect timer running (that is, the user has NOT already clicked recently)
        this.deselectTimer = setTimeout(function() { // create a timer that will react to a single-click (by deselecting any selected div) in 250 ms
          this.deselectTimer = null;
          this.cancelEditEvent();
        }.bind(this), 250);
      }
    }
  }

  linkEvent(userRequest, data) {
    // Set data for the relation and create it
    const time = Date.now();
    const obj = {"CRUD":"create"};
    obj.data = {
      "k_fromID": data._id, // from the event (using the GUID it was just given)
      "k_toID": this.GUID // to the calendar
    };
    obj.meta = {
      "s_type": "scheduledEvent",
      "s_schema":`scheduledEvent${app.metaData.node.scheduledEvent.version}`,
      "d_modified":time,
      "d_created":time,
      "d_deleted":0
    };
    app.REST.sendCouchDBquery(obj, "Linking event", userRequest, this.widgetDOM);

    // Add the new event to the calendar's eventByDate list
    const date = Date.parse(this.newEvent.d_date);
    if (!this.eventCache[date]) {
      this.eventCache[date] = {"events":[]};
    }
    this.eventCache[date].events.push({"GUID":data._id, "column":this.newEvent.column});

    // Set selectedEvent and newEvent
    this.newEvent = null;
    this.selectedEvent = JSON.parse(JSON.stringify(app.cache[data._id].doc));

    this.refresh();
  }

  cancelEditEvent(button) {
    // Make sure the old selected event is stored in the correct day
    if (this.selectedEvent){ // If the selected event exists...
      const oldDate = Date.parse(app.cache[this.selectedEvent._id].doc.data.d_date);
      const newDate = Date.parse(this.selectedEvent.data.d_date);
      if (oldDate !== newDate) { // ...and its date has been changed...
        // Put it back in the list of events for its original date...
        this.eventCache[oldDate].events.push({"GUID":this.selectedEvent._id});
        // And remove it from the list of events for its changed date
        this.eventCache[newDate].events.splice(this.eventCache[newDate].events.findIndex(x => x.GUID === this.selectedEvent._id));
      }
    }

    // Reset selected event and new event
    this.selectedEvent = null;
    this.newEvent = null;

    // Show the calendar's details instead of an event's in the details pane
    this.detailsPane.innerHTML = "";
    this.containedWidgets = this.containedWidgets.filter(x => x !== this.details.widgetID);
    this.containedWidgets.push(app.idCounter);
    this.details = new widgetDetails('calendar', this.detailsPane, this.GUID);
    return this.details.getData()
    .then(this.refresh.bind(this));
  }

  duplicate() {
    this.addEvent(null, this.selectedEvent.data)
    .then(function() {
      const dateInput = app.domFunctions.getChildByIdr(this.details.tBodyDOM, 'thd_date').nextElementSibling.firstElementChild;
      if (dateInput) { // Should always exist, but can't hurt to check
        dateInput.select();
        dateInput.focus();
      }
    }.bind(this));
  }

  updateDetails(input) {
    // Get the event to update - either a cached node if we're working with an existing event, or this.newEvent if not
    let evntDetails = null;
    if (this.selectedEvent) { // If the GUID exists and corresponds to something in the cache
      evntDetails = this.selectedEvent.data;
    }
    else { // If no GUID was provided, we're updating the new event
      evntDetails = this.newEvent;
    }

    // Get the attribute to update and update it with the new value, assuming it can be parsed
    const attribute = input.getAttribute('db'); // t_start, t_end or d_date, so far
    switch(attribute.charAt(0)) {
      case 't':
        if (this.parseTime(input.value)) {
          evntDetails[attribute] = this.parseTime(input.value);
        }
        break;
      case 'd':
        const parsedDate = Date.parse(input.value);
        if (parsedDate) {
          // At the moment, d_date is the only d_ attribute we have, but you never know - it may change
          if (attribute === "d_date" && this.selectedEvent) {
            // Remove the selected event from the old date
            const oldDate = Date.parse(this.selectedEvent.data.d_date);
            this.eventCache[oldDate].events.splice(this.eventCache[oldDate].events.findIndex(x => x.GUID === this.selectedEvent._id));
            // Place the selected event on the new date
            if (!this.eventCache[parsedDate]) {
              this.eventCache[parsedDate] = {"events":[]};
            }
            this.eventCache[parsedDate].events.push({"GUID":this.selectedEvent._id});
          }
          evntDetails[attribute] = input.value;
        }
        break;
      default:
        evntDetails[attribute] = input.value;
        break;
    }

    this.day = new Date(evntDetails.d_date); // Update the day if it's changed - that will mean moving to another day in the display if necessary

    // Redraw the calendar including all events
    this.refresh();
  }

  keyPressed(evnt) {
    // Keypresses while typing shouldn't have these effects
    if (evnt.target.tagName !== "INPUT" && evnt.target.tagName !== "TEXTAREA") {
      switch(evnt.which) {
        case 46: // These are the backspace and delete keys.
        case 8:
          this.deleteKey();
          break;
      }
    }
  }

  publish(button) {
    switch(this.mode) {
      case 'day':
        this.publishMonth(this.day.getMonth(), this.day.getFullYear());
        break;
      case 'week':
        const sunday = new Date(this.day);
        sunday.setDate(sunday.getDate() - sunday.getDay()); // This should give the Sunday of the desired week by basically "backing up" until the day is 0 (representing Sunday)
        const saturday = new Date(sunday);
        saturday.setDate(saturday.getDate() + 6);
        this.publishMonth(sunday.getMonth(), sunday.getFullYear());
        if (sunday.getMonth != saturday.getMonth()) {
          this.publishMonth(saturday.getMonth(), saturday.getFullYear());
        }
        break;
      case 'month':
        this.publishMonth(this.day.getMonth(), this.day.getFullYear());
        break;
      case 'year':
        for (let i = 0; i < 12; i++) {
          this.publishMonth(i, this.day.getFullYear());
        }
        break;
    }
  }

  // Private functions

  // Called by the constructor, at least for now, and nowhere else
  buildHeader() {
    let publish = "";
    if (this.GUID === 'PublicCalendar') {
      publish = `<input type="button" idr="publishButton" value="Publish to main website" onclick="app.widget('publish', this)">`;
    }
    const html = app.widgetHeader('widgetCalendar') +
      `<b idr="widgetName">${this.name}</b>
      <input type="button" idr="backButton" value="<" onclick="app.widget('page', this)">
      <input type="button" idr="dayButton" value="Day" onclick="app.widget('changeView', this)">
      <input type="button" idr="weekButton" value="Week" onclick="app.widget('changeView', this)">
      <input type="button" idr="monthButton" value="Month" onclick="app.widget('changeView', this)">
      <input type="button" idr="yearButton" value="Year" onclick="app.widget('changeView', this)">
      <input type="button" idr="forwardButton" value=">" onclick="app.widget('page', this)">
      <input type="button" idr="details" value="Show Details" onclick="app.widget('toggleWidgetDetails', this)"></span>
      <input type="button" class="hidden" idr="cancelButton" value="Cancel" onclick="app.REST.stopProgress(this)">
      ${publish}
    </div>
    <div class="widgetBody freezable"><table><tr idr="calendarRow">
      <td id="calendar${this.widgetID}"></td>
      <td id = "detailsPane" class="hidden">
        <b idr= "nodeTypeLabel" contentEditable="true">${this.nodeLabel}</b>
        <b idr="nodeLabel">: ${this.name}</b>
      </td>
    </tr></table></div></div>`;

    const parent = document.getElementById('widgets');
    const newWidget = document.createElement('div'); // create placeholder div

    parent.insertBefore(newWidget, parent.firstElementChild) // Insert the new div at the top of the widgets div

    newWidget.outerHTML = html; // replace placeholder with the div that was just written
    this.calendarDOM = document.getElementById(`calendar${this.widgetID}`);
    this.calendarDOM.classList.add("calendarDiv");
    this.calendarDOM.classList.add("calendar");
    this.calendarDOM.setAttribute("onclick", "app.widget('deselectAll', this, event)");
    this.widgetDOM = document.getElementById(`${this.widgetID}`);
    this.widgetDOM.classList.add("resizeable");

    const widgetList = document.getElementById("widgetList"); // Get the list of widgets

    const newEntry = document.createElement("li"); // Create an entry for the new widget
    widgetList.insertBefore(newEntry, widgetList.firstElementChild);

    // Set up the new widget's entry - it should describe the widget for now, and later we'll add listeners
    newEntry.outerHTML = `<li onclick="app.clickWidgetEntry(this)" draggable="true" ondragstart="app.drag(this, event)"
    ondragover="event.preventDefault()" ondrop="app.drop(this, event)" id="entry${this.widgetID}">
    Calendar: <span id="entryName${this.widgetID}">${this.name}</span></li>`;

    if (app.activeWidget) {
      app.activeWidget.classList.remove("activeWidget");
    }
    app.activeWidget = this.widgetDOM;
    this.widgetDOM.classList.add("activeWidget");

    this.selectedButton = app.domFunctions.getChildByIdr(this.widgetDOM, `${this.mode}Button`);
    this.selectedButton.classList.add("selectedButton");

    this.detailsPane = document.getElementById('detailsPane');
    this.containedWidgets.push(app.idCounter);
    this.details = new widgetDetails('calendar', this.detailsPane, this.GUID);
    this.details.getData()
    .then(function() {
      const name = app.getProp(this.details,"currentData","data","s_name");
      if(name) {
        const widgetName = app.domFunctions.getChildByIdr(this.widgetDOM, "widgetName");
        widgetName.innerHTML = name;
        const entryName = document.getElementById(`entryName${this.widgetID}`);
        entryName.innerHTML = name;
      }

      const header = app.domFunctions.getChildByIdr(this.widgetDOM, "header");
      app.createViewerDropdown(header, this.GUID);
    }.bind(this));

    this.refresh();
  }

  // Functions used to render the calendar
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

  calendarTemplate(dateString, columns) {
    const calendar = document.createElement('table');
    // calendar.classList.add('calendar');
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

    this.calendarTable = calendar;
    return calendar;
  }

  checkToday(day) {
    const now = new Date();
    return day.getFullYear()  == now.getFullYear()
        && day.getMonth()     == now.getMonth()
        && day.getDate()      == now.getDate();
  }

  buildDay(date) {
    this.assignEventColumns(date.getTime());

    const day = this.days[date.getDay()];
    const month = this.months[date.getMonth()];
    const dateString = `${day}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
    const calendar = this.calendarTemplate(dateString, 2);

    this.addTimeCells(calendar, 1, this.dayWidth, date);

    // If the day being displayed is the current day, display current time on the table
    if (this.checkToday(this.day)) {
      this.todayDrawLine(calendar);
    }

    // Use it to check for events on this day
    const events = app.getProp(this, "eventCache", date.getTime(), "events");

    // Get values we'll need to position event divs:

    // The bounding rectangle for the whole calendar
    const rect = calendar.getBoundingClientRect();

    // The width of the first column (which we DON'T want the events overlapping)
    const firstCell = calendar.children[1].children[0]; // First cell in first non-header row
    const cellRect = firstCell.getBoundingClientRect();
    const skipWidth = parseInt(cellRect.width);

    // The number of columns in the day, and width of each one
    const colWidth = rect.width - skipWidth;
    let numCols = this.eventCache[date.getTime()].columns;
    if (numCols == null) {
      numCols = 1;
    }
    const evntWidth = colWidth / numCols;

    // If there are any events...
    if (events && events.length > 0) {

      // For every event...
      for (let i = 0; i < events.length; i++) {
        let colNum = events[i].column;
        const evntSkipWidth = skipWidth + evntWidth*colNum;

        this.showEvent(events[i].GUID, evntSkipWidth, evntWidth);
      } // end for (every event)
    } // end if (there are events today)

    if (Date.parse(app.getProp(this, "newEvent", "d_date")) == date.getTime()) { // If there's a new event today
      const colNum = this.newEvent.column;
      const evntSkipWidth = skipWidth + evntWidth*colNum;
      this.showEvent(null, evntSkipWidth, evntWidth);
    }
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
    const month = this.months[sunday.getMonth()];
    const dateString = `Week of ${month} ${sunday.getDate()}, ${sunday.getFullYear()}`;

    const calendar = this.calendarTemplate(dateString, 8); // Create the table and first row
    const days = document.createElement("tr");
    calendar.appendChild(days);
    const blank = document.createElement("th"); // The row with the days starts with a blank space above the times
    days.appendChild(blank);
    this.weekAddDayCells(days, sunday);
    this.addTimeCells(calendar, 7, this.weekWidth, sunday);
    this.weekAddEvents(calendar, sunday);
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

  addTimeCells(calendar, columns, width, firstDay) {
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
      if (i === 0) {
        timeslot.setAttribute('idr', 'firstRow');
      }
      if (i === 23) {
        timeslot.setAttribute('idr', 'lastRow');
      }
      timeLabel.appendChild(timeText);
      timeLabel.setAttribute("width", this.labelWidth);
      timeslot.appendChild(timeLabel);

      for (let j = 0; j < columns; j++) {
        const day = new Date(firstDay);
        day.setDate(day.getDate() + j);

        const timeCell = document.createElement("td");
        timeCell.setAttribute("height", this.hourHeight);
        timeCell.setAttribute("width", width);
        timeCell.setAttribute("ondblclick", "app.widget('addEvent', this)");
        timeCell.setAttribute("date", `${day.getMonth() + 1}/${day.getDate()}/${day.getFullYear()}`);
        timeCell.setAttribute("hour", i);
        timeCell.classList.add("timeCell");
        timeslot.appendChild(timeCell);
      }
      calendar.appendChild(timeslot);
    }
  }

  weekAddEvents(calendar, sunday) {
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday); // Create a Date object
      day.setDate(day.getDate() + i); // Move to the correct day of the week

      this.assignEventColumns(day.getTime()); // Assign all columns first, before rendering
    }
    for (let i = 0; i < 7; i++) {
      const colHeader = calendar.children[1].children[i + 1]; // header cell for this column
      const colRect = colHeader.getBoundingClientRect();
      const calendarRect = calendar.getBoundingClientRect();
      let colWidth = parseInt(colRect.width);
      let colHeight = parseInt(colRect.height);
      let skipWidth = colRect.left - calendarRect.left;

      const day = new Date(sunday); // Create a Date object
      day.setDate(day.getDate() + i); // Move to the correct day of the week

      // Use it to check for events on this day
      const events = app.getProp(this, "eventCache", day.getTime(), "events");
      let numCols = this.eventCache[day.getTime()].columns;
      if (numCols == null) {
        numCols = 1;
      }
      const evntWidth = colWidth / numCols;

      if (events && events.length > 0) {
        // update colWidth to account for multiple columns - it's the base width divided by this day's number of columns
        // For every event...
        for (let i = 0; i < events.length; i++) {
          const colNum = events[i].column;
          const evntSkipWidth = skipWidth + evntWidth*colNum;
          // update skipWidth to account for multiple columns - it's the base skip distance plus evntWidth * colNum
          // (so events in column 0 aren't offset at all; ones in column 1 are offset by the width of one event, etc.)
          this.showEvent(events[i].GUID, evntSkipWidth, evntWidth, colHeight);
        } // end for (every event)
      } // end if (there are events)
      // Finally, add the width of this column to skipWidth (so events on the NEXT day will be that much farther over)

      if (Date.parse(app.getProp(this, "newEvent", "d_date")) == day.getTime()) { // If there's a new event today
        const colNum = this.newEvent.column;
        const evntSkipWidth = skipWidth + evntWidth*colNum;
        this.showEvent(null, evntSkipWidth, evntWidth, colHeight);
      }

      skipWidth += colWidth;
    } // end for (every day of the week)
  }

  showEvent(evntGUID, skipWidth, width, extraHeaderHeight) {
    const selectedID = app.getProp(this.selectedEvent, "_id");

    let evnt = null;
    if (evntGUID && evntGUID === selectedID) {
      evnt = this.selectedEvent.data;
    }
    else if (evntGUID) {
      evnt = app.cache[evntGUID].doc.data;
    }
    else {
      evnt = this.newEvent;
    }

    if (!extraHeaderHeight) {
      extraHeaderHeight = 0;
    }

    const tableRect = this.calendarTable.getBoundingClientRect();
    const divRect = this.calendarDOM.getBoundingClientRect();
    const top_of_div = divRect.top;
    const firstRow = app.domFunctions.getChildByIdr(this.calendarTable, 'firstRow');
    const top_of_table = firstRow.getBoundingClientRect().top;
    const lastRow = app.domFunctions.getChildByIdr(this.calendarTable, 'lastRow');
    const bottom_of_table = lastRow.getBoundingClientRect().bottom;
    const totalHeaderHeight = top_of_table - top_of_div;

    // Calculate the number of pixels used in the table to represent each minute
    const minutes_in_day = 60*24;
    const pixels_in_table = bottom_of_table - top_of_table;
    const pix_per_min = pixels_in_table/minutes_in_day;

    // Create the div
    const evntDiv = document.createElement("div");
    if (!evntGUID) {
      evntDiv.classList.add("newEvent");
    }
    if (app.getProp(app.cache, evntGUID, "doc", "data", "published") === true) {
      evntDiv.classList.add("publishedEvent");
    }

    evntDiv.classList.add("event");

    if (evntGUID && evntGUID !== selectedID) { // If an event is already new or selected, it can't be selected again
      evntDiv.setAttribute("onclick", "event.stopPropagation();app.widget('viewEvent', this)");
      evntDiv.setAttribute("GUID", evntGUID);
    }
    else { // new or selected events can be resized
      evntDiv.setAttribute("onmousedown", "app.widget('startDrag', this, event)");
    }

    // calculate the height and position of the rectangle needed to display the event
    let startTime = this.parseTime(evnt.t_start);
    if (!startTime) {
      startTime = {hours:0, minutes:0};
    }

    let endTime = this.parseTime(evnt.t_end);
    if (!endTime) {
      endTime = {hours:23, minutes:59}
    }

    const minutes_until_start = startTime.hours*60 + startTime.minutes;
    const top_pos = pix_per_min * minutes_until_start + totalHeaderHeight; // Calculate how far below the top of the table the div should start
    const minutes_until_end = endTime.hours*60 + endTime.minutes;
    skipWidth = skipWidth + tableRect.x - divRect.x;
    const height = pix_per_min * (minutes_until_end - minutes_until_start);
    evntDiv.setAttribute("style",
      `position:absolute;
      top:${top_pos}px;
      left:${skipWidth}px;
      width:${width}px;
      height:${height}px;`);
    this.calendarDOM.appendChild(evntDiv);

    if (evntGUID === selectedID) {
      // Give the event div the selectedEvent class
      evntDiv.classList.add("selectedEvent");
    }

    // Add the name of the event. Make the name a link to the URL of the event, if there is one
    const namePar = document.createElement("p");
    evntDiv.appendChild(namePar);
    let href = "";
    if (evnt.l_URL) {
      namePar.innerHTML = `<a href="${evnt.l_URL}" target="_blank">${evnt.s_name}</a>: `;
    }
    else {
      namePar.innerHTML = `${evnt.s_name}: `;
    }

    // Add the time of the event
    startTime = this.convert24HrToAMPM(startTime);
    endTime = this.convert24HrToAMPM(endTime);

    const timeString = `${startTime.hours}:${startTime.minutes.toString().padStart(2, "0")} ${startTime.AMPM} - ${endTime.hours}:${endTime.minutes.toString().padStart(2, "0")} ${endTime.AMPM} `;
    namePar.innerHTML += timeString;

    // Add the description of the event
    if (evnt.s_description) {
      const descPar = document.createElement('p');
      evntDiv.appendChild(descPar);
      descPar.innerHTML = evnt.s_description;
    }

    // Add the address and location of the event. Make the address link to Google Maps
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

    return evntDiv;
  }

  buildMonth(date) {
    const dateString = `${this.months[date.getMonth()]} ${date.getFullYear()}`;
    const calendar = this.calendarTemplate(dateString, 8);
    calendar.setAttribute("class", "month");

    this.displayMonth(date, calendar);
  }

  displayMonth(date, table) {
    // Create a new date object with the given date
    const currentDay = new Date(date);

    // Get the day to start on - the Sunday of the week when the month starts
    currentDay.setDate(1);
    currentDay.setDate(1 - currentDay.getDay());

    // Create a header row with days of the week
    const header = document.createElement("tr");
    table.appendChild(header);
    const weekHandle = document.createElement("TD");
    weekHandle.classList.add('weekHandle');
    header.appendChild(weekHandle);

    for (let i = 0; i<7; i++) {
      const day = document.createElement("th");
      let dayName = document.createTextNode(this.shortDays[i]);
      if (this.mode === "year") {
        dayName = document.createTextNode(this.dayLetters[i]);
      }
      day.appendChild(dayName);
      header.appendChild(day);
    }

    for (let i = 0; i < 6; i++) { // add a week
      const row = document.createElement("tr");
      table.appendChild(row);
      const weekHandle = document.createElement("TD");
      weekHandle.classList.add('weekHandle');

      let day = currentDay.getDate();
      let month = currentDay.getMonth();
      let year = currentDay.getFullYear();

      // If this is the first week of the month, and it doesn't start on the first day, then the start of the week will actually be in the previous month.
      if (i == 0 && day !== 1) {
        // In that case, rather than zoom to the start of the week, zoom to the start of the month.
        day = 1;
        month = date.getMonth();
        year = date.getFullYear();
      }

      weekHandle.setAttribute('onclick', `app.widget('zoomToWeek', this, ${year}, ${month}, ${day})`);
      row.appendChild(weekHandle);

      for (let j = 0; j < 7; j++) { // add a day
        const day = document.createElement("td");
        day.classList.add("monthDay");
        day.setAttribute("ondblclick", "app.widget('addEvent', this)");
        day.setAttribute('date', `${currentDay.getMonth() + 1}/${currentDay.getDate()}/${currentDay.getFullYear()}`);
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
          const events = app.getProp(this, "eventCache", dayMS, "events");

          if (events && events.length > 0) { // If there are events on this date
            dayDiv.classList.add("hasEvent");
            if (this.mode === "month") { // If we're building a month for month view, not year view
              for (let i = 0; i < events.length; i++) {
                const eventDetails = app.cache[events[i].GUID].doc.data;
                const p = document.createElement("p");
                p.setAttribute("GUID", events[i].GUID);
                p.setAttribute("URL", eventDetails.l_URL);
                p.classList.add("eventName");
                p.setAttribute("onclick", "event.stopPropagation();app.widget('viewEvent', this)");
                const text = document.createTextNode(eventDetails.s_name);
                p.appendChild(text);
                dayDiv.appendChild(p);
              } // end for (every event)
            } // end if (the calendar is in month mode)
          } // end if (there are events)

          if (this.newEvent && Date.parse(this.newEvent.d_date) === dayMS) {
            dayDiv.classList.add("hasNewEvent");
            if (this.mode === "month") {
              const p = document.createElement("p");
              p.innerHTML = "New Event";
              dayDiv.appendChild(p);
              day.setAttribute('onclick', 'event.stopPropagation()');
            }
          }

          if (this.selectedEvent && Date.parse(this.selectedEvent.data.d_date) === dayMS) {
            dayDiv.classList.add("hasSelectedEvent");
            day.setAttribute('onclick', 'event.stopPropagation()');
          }
        } // end else (this date is in the given month)

        day.id = `${currentDay.getMonth()}-${currentDay.getDate()}-${currentDay.getFullYear()}`; // month-day-year formatting

       //update the day
        currentDay.setDate(currentDay.getDate() + 1);
        row.appendChild(day);
      }
    }
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
        monthDate.setDate(1);
        monthDate.setMonth(i*4 + j); // calculate the month to be displayed

        const header = document.createElement("tr"); // Create a header with the name of the month
        const headerCell = document.createElement("th");
        headerCell.setAttribute("colspan", "8");
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

  // Functions used to find or create events on the calendar (will probably change the most between public and Harmony versions)
  getEvents() {
    const userRequest = app.REST.startUserRequest("Search for events", this.widgetDOM);
    const eventNodeGUIDs = [];
    const eventsToSearch = [];

    const selector = {"$or":[{"meta.d_deleted":0},{"meta.d_deleted":{"$exists":false}}],
                      "data.k_toID":{"$eq":this.GUID},
                      "meta.s_type":{"$eq":"scheduledEvent"}}

    return app.getDocBatch(userRequest, selector, this.widgetDOM)
    .then(function(relations) {
      for (let i = 0; i < relations.length; i++) { // Create list of all node GUIDs and list of node GUIDs to search for (because those nodes aren't cached yet)
        eventNodeGUIDs.push(relations[i].data.k_fromID); // Add the event GUID to the list of all node GUIDs, no matter what
        if (!(app.getProp(app, "cache", relations[i].data.k_fromID))) { // If this event is not already cached...
          eventsToSearch.push(relations[i].data.k_fromID); // also add it to the list of GUIDs to search for
        }
      }
      // get nodes corresponding to the events. This returns a promise, so the next part won't execute until it resolves.
      const selector = {"_id":{"$in":eventsToSearch}};
      return app.getDocBatch(userRequest, selector, this.widgetDOM);
    }.bind(this))
    .then(function() {
      for (let i = 0; i < eventNodeGUIDs.length; i++) { // For every event GUID we've stored...
        const event = app.cache[eventNodeGUIDs[i]].doc.data; // Get its details from the cache.
        if (event.d_date && Date.parse(event.d_date)) { // Assuming it has a date (it should) and the date can be parsed...
          const parsedDate = Date.parse(event.d_date); // Parse it and use the parsed date as the key in the eventCache object.
          if (!app.getProp(this, "eventCache", parsedDate)) { // Create the array of events on this date if it doesn't already exist...
            this.eventCache[parsedDate] = {"events":[]};
          }
          this.eventCache[parsedDate].events.push({"GUID":eventNodeGUIDs[i]}); // and add this event's GUID to that array.
        }
      }
    }.bind(this));
  }

  publishMonth(month, year) {
    let eventArray = [];
    let eventGUIDArray = [];

    const date = new Date(year, month); // Midnight on the first day of the month
    while (date.getMonth() === month) { // For every day in the month
      const events = app.getProp(this, "eventCache", date.getTime(), "events"); // Get events for this day
      if (events) {
        for (let i = 0; i < events.length; i++) {
          const data = app.getProp(app.cache, events[i].GUID, "doc", "data");
          if (data) {
            eventArray.push(data);
            eventGUIDArray.push(events[i].GUID);
          }
        }
      }
      date.setDate(date.getDate() + 1); // Move on to the next day
    }

    const serverObj = {"year":year, "month":month, "data":JSON.stringify(eventArray), "server":"web", "msg":"publishCalendarMonth"}

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "");  // get ready to send headers
    const calendar = this;

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        calendar.markEventsPublished(eventGUIDArray);
      }
    }

    // set basic authentications
    xhttp.setRequestHeader("Authorization", "Basic " + btoa(`amy:`));
    xhttp.send(JSON.stringify(serverObj));
  }

  markEventsPublished(eventGUIDs) {
    const promises = [];
    const userRequest = app.REST.startUserRequest("Saving node", this.widgetDOM);

    for (let i = 0; i < eventGUIDs.length; i++) {
      const obj = app.cache[eventGUIDs[i]].doc;
      obj.data.published = true;
      obj.CRUD = "update";
      promises.push(app.REST.sendCouchDBquery(obj, "Updating events", userRequest, this.widgetDOM));
    }

    Promise.all(promises).then(this.refresh.bind(this));
  }

  // Functions used to order events and place them in the correct columns
  assignEventColumns(date) {
    if (!app.getProp(this, "eventCache", date)) {
      this.eventCache[date] = {"events":[]};
    }

    this.eventCache[date].events.sort(this.compareStartTimes.bind(this));

    const todayEvents = this.eventCache[date].events; // shorter alias
    if (this.newEvent && Date.parse(this.newEvent.d_date) == date) { // If there's a new event on this date, add it to the list
      this.insertEvent(todayEvents, this.newEvent);
    } // end if (there's a new event on this date)

    let maxColumn = 0; // This will be the highest column number we end up using on this date
    for (let i = 0; i < todayEvents.length; i++) { // Go through all events on the date, in order.
      let thisEnd = null;
      if (todayEvents[i] === this.newEvent) { // if this is the new event
        thisEnd = this.newEvent.t_end;
      }
      else if (todayEvents[i].GUID === app.getProp(this, "selectedEvent", "_id")) {
        thisEnd = this.parseTime(this.selectedEvent.data.t_end);
      }
      else {
        const thisEvnt = app.cache[todayEvents[i].GUID].doc.data;
        thisEnd = this.parseTime(thisEvnt.t_end); // Parse the event's end time
      }

      let column = 0; // This is the column we're trying to place the event in - start at 0 and increment until a column is found where the event can go
      let available = true; // This is a boolean that marks whether this event can go in a given column

      while(!this.checkColumn(i, column, todayEvents)) {
        column++; // Increment the column until a column is found which has no conflict
      }

      // At this point, column is the column in which this event should be shown
      todayEvents[i].column = column;
      if (maxColumn < column) { // Update maxColumn if we've just stored a larger column number than we'd seen before
        maxColumn = column;
      }
    } // end for (all events on the given date)
    this.eventCache[date].columns = maxColumn + 1; // Store the final value of maxColumn - the number of columns needed for this date

    // If a new event was inserted into todayEvents, remove it
    if (todayEvents.indexOf(this.newEvent) > -1) {
      todayEvents.splice(todayEvents.indexOf(this.newEvent), 1);
    }
  }

  compareStartTimes(a, b) { // Sort events by start time
    let aStart = this.parseTime(app.cache[a.GUID].doc.data.t_start);
    if (a.GUID === app.getProp(this, "selectedEvent", "_id")) {
      aStart = this.parseTime(this.selectedEvent.data.t_start);
    }
    let bStart = this.parseTime(app.cache[b.GUID].doc.data.t_start);
    if (b.GUID === app.getProp(this, "selectedEvent", "_id")) {
      bStart = this.parseTime(this.selectedEvent.data.t_start);
    }

    if (aStart.hours !== bStart.hours) {
      return aStart.hours - bStart.hours;
    }
    return aStart.minutes - bStart.minutes;
  }

  insertEvent(eventList, eventDetails) {
    let data = eventDetails.data || eventDetails;
    let newPosition = null;
    let newStart = data.t_start;

    // Find the first event that the new event could go before (the first one that starts at the same time or later)
    for (let i = 0; i < eventList.length; i++) {
      const start = this.parseTime(app.cache[eventList[i].GUID].doc.data.t_start);

      if (start.hours > newStart.hours || start.hours == newStart.hours && start.minutes >= newStart.minutes) {
        newPosition = i;
        break;
      }
    }

    // Insert the event's GUID if it has one, or the whole event if not
    let toInsert = eventDetails;
    if (eventDetails._id) {
      toInsert = {"GUID":eventDetails._id};
    }
    // Insert the new event in the list of GUIDs before that event, or at the end if no such event was found
    if (newPosition == null) {
      eventList.push(toInsert);
    }
    else {
      eventList.splice(newPosition, 0, toInsert);
    }
  }

  checkColumn(i, column, todayEvents) {
    let thisStart = null;
    if (todayEvents[i] === this.newEvent) { // if this is the new event
      thisStart = this.newEvent.t_start;
    }
    else if (todayEvents[i].GUID === app.getProp(this, "selectedEvent", "_id")) {
      thisStart = this.parseTime(this.selectedEvent.data.t_start);
    }
    else {
      const thisEvnt = app.cache[todayEvents[i].GUID].doc.data;
      thisStart = this.parseTime(thisEvnt.t_start); // Parse the event's start time
    }

    let available = true; // Reset available - always start by assuming the event CAN go in the column
    // Go through all earlier events
    for (let j = 0; j < i; j++) {
      const otherCol = todayEvents[j].column; // Get the column of the other event

      let otherEnd = null;
      if (todayEvents[j] === this.newEvent) {
        otherEnd = this.newEvent.t_end;
      }
      else if (todayEvents[j].GUID === app.getProp(this, "selectedEvent", "_id")) {
        otherEnd = this.parseTime(this.selectedEvent.data.t_end);
      }
      else {
        const otherData = app.cache[todayEvents[j].GUID].doc.data;
        otherEnd = this.parseTime(otherData.t_end); // parse the earlier event's end time
      }

      // If the other event is in the desired column and ends after the start of this event, they overlap (since we know the other event STARTED before this one)
      if (otherCol == column && (otherEnd.hours > thisStart.hours || otherEnd.hours == thisStart.hours && otherEnd.minutes > thisStart.minutes)) {
        available = false;
        break; // No need to keep checking this column once one conflict has been found
      } // end if (there's a conflicting event in this column; move to the next column)
    } // end for (every event which starts earlier than this one; check for conflicting events)
    return available;
  }

  // Function called when a new event is added or an existing one is selected, which displays its details in the details panel
  showEventDetails(evntGUID) {
    // Show the details panel if it wasn't shown already...
    const button = app.domFunctions.getChildByIdr(this.widgetDOM, 'details');
    if (button.value == "Show Details") {
      this.toggleWidgetDetails(button);
    }

    // The details panel is now showing, so we can call refresh to make sure any divs we show are in the right place
    this.refresh();

    // And fill it with a widgetDetails corresponding to this event
    this.containedWidgets = this.containedWidgets.filter(x => x !== this.details.widgetID);
    this.containedWidgets.push(app.idCounter);
    this.detailsPane.innerHTML = ""; // remove any details that were already shown
    this.details = new widgetDetails('calendarEvent', this.detailsPane, evntGUID);
    return this.details.getData() // Everything from here on in is part of the promise to be returned
    .then(function() {
      // If there's no event GUID, we're making a new event - populate the widgetDetails with the new event's values
      if (!evntGUID) {
        this.details.currentData.data.s_name = this.newEvent.s_name;
        const date = new Date(this.newEvent.d_date);
        this.details.currentData.data.d_date = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
        let startTime = this.convert24HrToAMPM(this.newEvent.t_start);
        let endTime = this.convert24HrToAMPM(this.newEvent.t_end);
        this.details.currentData.data.t_start = `${startTime.hours}:${startTime.minutes.toString().padStart(2,"0")} ${startTime.AMPM}`;
        this.details.currentData.data.t_end = `${endTime.hours}:${endTime.minutes.toString().padStart(2,"0")} ${endTime.AMPM}`;
        this.details.refresh();
      }

      const oldSaveComplete = this.details.saveComplete.bind(this.details);
      this.details.saveComplete = function(userRequest, data) {
        oldSaveComplete(userRequest, data);

        const inputs = this.details.tBodyDOM.getElementsByTagName('input');
        for (let i = 0; i < inputs.length; i++) {
          inputs[i].setAttribute("onchange", `${inputs[i].getAttribute("onchange")};app.widget('updateDetails', this, '${evntGUID}')`);
        }

        let afterSave = this.refresh.bind(this);
        if (this.newEvent && data && data._id) { // If a new event was successfully saved, link it to the calendar
          afterSave = this.linkEvent.bind(this);
        }
        afterSave(userRequest, data);
      }.bind(this)

      // Add a cancel button and a duplicate button (if this is not a new node)
      const main = app.domFunctions.getChildByIdr(this.details.widgetDOM, "main");
      const cancelButton = document.createElement("input");
      this.details.widgetDOM.insertBefore(cancelButton, main);
      cancelButton.outerHTML = `<input type="button" value="Cancel"
                          onclick="app.widget('cancelEditEvent', this)">`;
      this.details.cancelEditEvent = this.cancelEditEvent.bind(this);

      if (evntGUID) {
        const duplicateButton = document.createElement("input");
        this.details.widgetDOM.insertBefore(duplicateButton, main);
        duplicateButton.outerHTML = `<input type="button" value="Duplicate"
                            onclick="app.widget('duplicate', this)">`;
        this.details.duplicate = this.duplicate.bind(this);
      }

      // Call updateDetails whenever the inputs are changed
      const inputs = this.details.tBodyDOM.getElementsByTagName('input');
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute("onchange", `${inputs[i].getAttribute("onchange")};app.widget('updateDetails', this, '${evntGUID}')`);
      }

      this.details.updateDetails = this.updateDetails.bind(this);
    }.bind(this)); // end of then function
  }

  // functions for dragging to resize an event
  startDrag(div, evnt) {
    if(evnt.offsetY < this.dragOffset) {
      evnt.preventDefault();
      this.mousePos = evnt.y;
      this.calendarDOM.setAttribute("onmousemove", "event.preventDefault();app.widget('resize', this, event, false)");
      this.calendarDOM.setAttribute("onmouseup", "app.widget('doneResizing', this, event, false)");
    }
    else {
      const height = div.getBoundingClientRect().height;
      if(height - evnt.offsetY < this.dragOffset) {
        evnt.preventDefault();
        this.mousePos = evnt.y;
        this.calendarDOM.setAttribute("onmousemove", "app.widget('resize', this, event, true)");
        this.calendarDOM.setAttribute("onmouseup", "app.widget('doneResizing', this, event, true)");
      }
    }
  }

  resize(calendar, evnt, bottom) {
    const dy = this.mousePos - evnt.y; // positive if the mouse is moving up
    this.mousePos = evnt.y;

    let div = null;
    if (this.selectedEvent) {
      div = this.calendarDOM.getElementsByClassName("selectedEvent")[0];
    }
    else {
      div = this.calendarDOM.getElementsByClassName("newEvent")[0];
    }

    if (div) {
      if(bottom) {
        // If we're moving the bottom, the div gets bigger as we drag down and smaller as we drag up - subtract dx from the height
        div.style.height = (parseInt(getComputedStyle(div, '').height) - dy) + "px";
      }
      else {
        // If we're moving the top, the div gets smaller as we drag down and bigger as we drag up - add dy to the height
        div.style.height = (parseInt(getComputedStyle(div, '').height) + dy) + "px";
        // Also, if we're moving the top, we have to move the top of the div closer to the border if we drag down and farther if we drag up
        div.style.top = (parseInt(getComputedStyle(div, '').top) - dy) + "px";
      }
    }
  }

  doneResizing(calendar, evnt, bottom) {
    this.calendarDOM.removeAttribute("onmousemove");
    this.calendarDOM.removeAttribute("onmouseup");

    // Get the height of the whole calendar...
    const calendarRect = this.calendarTable.getBoundingClientRect();
    let calendarHeight = calendarRect.height;
    let calendarTop = calendarRect.top;

    // And subtract the heights of any header rows
    let row = this.calendarTable.firstElementChild;
    while(row.firstElementChild.tagName === "TH") {
      const rowHeight = row.getBoundingClientRect().height;
      calendarHeight -= rowHeight;
      calendarTop += rowHeight;
      row = row.nextElementSibling;
    }

    // Calculate the time the mouse was released on
    const distanceFromTop = evnt.y - calendarTop;
    const minHeight = calendarHeight/(24*60);

    let minutes = Math.floor(distanceFromTop/minHeight);
    minutes = Math.round(minutes / this.minutesToRound) * this.minutesToRound; // round to the nearest x minutes, where x is stored in this.minutesToRound - currently 15
    let hours = Math.floor(minutes/60);
    minutes = minutes - hours*60;
    if (hours === 24 && minutes === 0) {
      hours = 23;
      minutes = 59; // Back up a minute in order to stay on the same day
    }
    let time = {"hours":hours, "minutes":minutes};
    time = this.convert24HrToAMPM(time);
    let timeString = `${time.hours}:${time.minutes.toString().padStart(2,"0")} ${time.AMPM}`;

    if(bottom) { // If dragging the bottom, update the value in the endTime field
      const endHeader = app.domFunctions.getChildByIdr(this.details.widgetDOM, 'tht_end');
      const endCell = endHeader.nextElementSibling;
      const endInput = endCell.firstElementChild;
      endInput.value = timeString;
      const evnt = new Event('change');
      endInput.dispatchEvent(evnt); // These three lines should imitate entering a new value in the end time text box
    }
    else { // If dragging the top, update the value in the startTime field
      const startHeader = app.domFunctions.getChildByIdr(this.details.widgetDOM, 'tht_start');
      const startCell = startHeader.nextElementSibling;
      const startInput = startCell.firstElementChild;
      startInput.value = timeString;
      const evnt = new Event('change');
      startInput.dispatchEvent(evnt); // These three lines should imitate entering a new value in the start time text box
    }
  }

  deleteKey() {
    if (this.newEvent) {
      this.cancelEditEvent(); // Deleting a new event is the same as canceling its creation
    }
    else if (this.selectedEvent) {
      this.unlinkSelectedEvent(); // To delete an existing event, it's necessary to update the database
    }
  }

  unlinkSelectedEvent() {
    // Starting with the selected event's GUID, find (in cache - no need to query the DB) the relation between it and the calendar
    const nodeID = this.selectedEvent._id;
    // Look for relations where...
    let relID = null;
    for (let GUID in app.cache) {
      const doc = app.cache[GUID].doc;
      if (app.getProp(doc,"data","k_fromID") === nodeID // the relation starts at the selected event...
       && app.getProp(doc,"data","k_toID") === this.GUID // the relation ends at the calendar...
       && app.getProp(doc,"meta","s_type") === "scheduledEvent") { // and the relation is of type "scheduledEvent"
         relID = GUID; // When one is found, set relID to its GUID and stop looking
         break;
       }
    }

    // Delete that relation from the database
    const obj = {"_id":relID, "CRUD":"delete"};
    const userRequest = app.REST.startUserRequest("Removing event", this.widgetDOM);
    app.REST.sendCouchDBquery(obj, "Removing event", userRequest, this.widgetDOM)
    .then(function(result){ // On successful deletion...
      delete app.cache[relID]; // Remove the relation from the cache
      // Remove the event from its eventCache array
      const date = Date.parse(this.selectedEvent.data.d_date);
      const events = this.eventCache[date].events;
      if (events) { // There certainly SHOULD be a list of events on this date, given that we just deleted one, but it can't hurt to check
        const deletedIndex = events.findIndex(x => x.GUID === this.selectedEvent._id);
        if (deletedIndex > -1) { // Again, there SHOULD always be one entry for the selected event, but it can't hurt to check
          events.splice(deletedIndex, 1); // Remove the event from the array
        }
      }

      this.selectedEvent = null; // Reset this.selectedEvent to null
      this.refresh(); // Refresh the calendar
    }.bind(this));
  }

  // General helper functions
  // Copied and modified from https://stackoverflow.com/questions/141348/what-is-the-best-way-to-parse-a-time-into-a-date-object-from-user-input-in-javas
  parseTime(t) {
    if (t == null) {
      return null; // If no string was passed in, it can't be parsed - return null
    }

    // If t was already an object with a valid hours and minutes attribute, just return a copy of it ("parsing" an already parsed time returns a new copy of the time object)
    if (typeof t == "object" && t.hours != null && t.minutes != null && t.hours >= 0 && t.hours < 24 && t.minutes >= 0 && t.minutes < 60) {
      return JSON.parse(JSON.stringify(t));
    }

    var d = {};
    /*
      This regex looks for and remembers:
        one or more digits (stored as time[1])
        a colon (optional),
        two digits (optional, stored as time[2])
        0 or more whitespace characters,
        then a "p", "P", "a" or "A" (optional, stored as time[3])
    */
    var time = t.match( /(\d+)(?::(\d\d))?\s*([pPaA]?)/ );

    if (!time || time[1] == null || time.length > 4 // If the whole result doesn't exist, or time[1] (hour) doesn't exist, or there's somehow more than four items...
      || isNaN(parseInt(time[1]) || time[2] != null && isNaN(parseInt(time[2]))) // or the hour can't be parsed, or the minute exists but can't be parsed...
      || parseInt(time[1]) < 0 || parseInt(time[1]) > 23 // or the hour is out of range...
      || time[3] && parseInt(time[1]) > 12 || parseInt(time[1]) == 0 // including if it's 0 or between 13 and 23 in an AM/PM format...
      || time[2] != null && parseInt(time[2]) < 0 || parseInt(time[2]) > 59) { // or the minute exists but is out of range
        return null; // the time can't be parsed. Return null.
    }

    // If time[3] doesn't exist (there is no am or pm indication), hours is just time[1].
    // Same goes for if time[3] does exist, but it's between 1:00 AM and 12:59 PM (times when the hour is the same in 24-hour and AM/PM time)
    d.hours = parseInt(time[1]);

    // If time[3] is "p" or "P", and hours is NOT 12, add 12 to hours because 13:00 in 24-hour time is equivalent to 1:00 PM in AM/PM time
    if ((time[3] === "p" || time[3] === "P") && d.hours !== 12) {
      d.hours += 12;
    }

    // If time[3] is "a" or "A", and hours IS 12, SUBTRACT 12 from hours (set it to 0) because 0:00 in 24-hour time is equivalent to 12:00 AM in AM/PM time
    if ((time[3] === "a" || time[3] === "A") && d.hours === 12) {
      d.hours = 0;
    }

    // And the minutes are equal to time[2] if it exists, and 0 otherwise.
    d.minutes = parseInt( time[2]) || 0;
    return d;
  }

  convert24HrToAMPM(time) {
    let copy = JSON.parse(JSON.stringify(time)); // make a copy
    copy.AMPM = "AM"; // default to AM
    if (copy.hours >= 12) {
      copy.AMPM = "PM";
    }
    if (copy.hours > 12) {
      copy.hours -= 12;
    }
    if (copy.hours == 0) {
      copy.hours = 12;
    }
    return copy;
  }
}
