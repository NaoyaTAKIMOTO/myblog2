---
title: "Stop Calculating Business Trip Travel Time by Hand"
date: 2026-11-15T13:10:00+09:00
draft: false
tags: [Go, React, Google Calendar API, travel planning, problem solving]
summary: "Copying addresses into a map app and subtracting travel time from every meeting is a nightly ritual for anyone who travels for work. BookingButler derives the origin from the calendar and works backwards from arrival. Here is what got automated and what stayed manual."
---

## What the night before a trip looks like

Preparing for tomorrow's business trip tends to go like this.

1. Open the calendar and check tomorrow's events and locations.
2. Copy each address into a map app and search the route.
3. Subtract the travel time from the meeting's start time.
4. Write the departure time down somewhere.
5. Repeat for every event.

A few minutes per event adds up quickly. And when one meeting moves, the arithmetic has to be redone. If yesterday was spent in another city, the origin is not home but the hotel or the previous site. That **choice of origin** is exactly what a map app cannot make for you.

**BookingButler** automates the subtraction from the calendar. A Go API fetches the events, Google Maps resolves the nearest station, NAVITIME returns the route, and the app places the departure and arrival times next to each event.

## Why existing tools fall short

| Approach | What it gives you | Where it breaks |
|---|---|---|
| The calendar's location field | Events and addresses in one place | No travel time is computed |
| A map app | Transfers and duration | You paste each address again; a human picks the origin |
| A spreadsheet | Your own reverse calculation | It does not follow changes; entries get missed |

What all three share is that **a person decides the origin**. The second meeting of the day starts from the previous site; a new day starts from home. Doing that check by hand is what makes the whole routine feel like work.

## The design

The workflow before and after.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: manual</strong>
    <div class="diagram-box">Open the calendar, read each location</div>
    <div class="diagram-box">Paste the address into a map app</div>
    <div class="diagram-box">Subtract the duration by hand</div>
    <div class="diagram-box">Recheck the notes on the day</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: BookingButler</strong>
    <div class="diagram-box">Pick a date range and sign in</div>
    <div class="diagram-box">Events and locations fetched at once</div>
    <div class="diagram-box">Origin decided automatically, routes planned</div>
    <div class="diagram-box">Departure and arrival next to each event</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: How departure times are worked out, before and after</p>
</div>

Three decisions carry the design:

- **The calendar is the only input**: locations come from the event's location field, so there is no second list to maintain.
- **The machine picks the origin**: the previous event on the same day, home on a new day.
- **The calculation runs backwards**: hand the routing API the event's start time and read the departure time back.

Burying the origin decision in a single function keeps the branching from growing with the number of events. It also forces assumptions: events with no location start from home, and all-day events are assumed to start at 9 a.m. That is a known gap, covered below.

## Implementation notes

### One place decides the origin

`ProcessEvents` in `backend/calendar/calendar_processor.go` compares the current event with the previous one and switches the origin.

```go
// backend/calendar/calendar_processor.go (ProcessEvents)
if isDateDifferenceOverOneDay(previousDate, currentEventDateStr) {
	if location != homeLocation {
		transitFromTimeStr, transitToTimeStr = planRoute(mapsClient, homeLocation, location, eventTimeStr)
	}
} else if previousLocation != "" && previousLocation != location {
	transitFromTimeStr, transitToTimeStr = planRoute(mapsClient, previousLocation, location, eventTimeStr)
}
```

A new date means home; the same date means the previous event's location. When two events share a location, no route is requested. `isDateDifferenceOverOneDay` normalizes both timestamps to UTC dates, so the test is about dates, not elapsed time.

### Working backwards from arrival

Routes come from NAVITIME through RapidAPI. Passing the event's start time as `goal_time` is the backwards calculation.

```go
// backend/calendar/calendar_processor.go (makeRapidAPIRequest)
parsedTime, err := time.Parse(time.RFC3339, goalTime)
goalTime = parsedTime.Format("2006-01-02T15:04:05")

query := url.Values{
	"start":      {fmt.Sprintf("%f,%f", startLat, startLng)},
	"goal":       {fmt.Sprintf("%f,%f", goalLat, goalLng)},
	"datum":      {"wgs84"},
	"term":       {"1440"},
	"limit":      {"5"},
	"goal_time":  {goalTime},
	"coord_unit": {"degree"},
}
```

An address cannot go straight into the routing API, so `getNearbyStationName` geocodes it and then finds a station within 3,000 meters. Only the first candidate's `move.from_time` and `move.to_time` are kept.

### The screen just lines up the times

The backend returns an array of `EventInfo`; the browser formats and displays it.

```tsx
// vite-project/src/App.tsx
{event.TransitFromTime && event.TransitToTime && (
  <p>Transit: {new Date(event.TransitFromTime).toLocaleString()} - {new Date(event.TransitToTime).toLocaleString()}</p>
)}
```

The call is a single `GET /api/events?code=<auth code>&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`. Vite forwards `/api` to the backend in development, so the frontend needs no extra configuration.

## Results

Per-event copying and subtraction collapses into "pick a range and sign in". What remains is reading the result.

The conditions come straight from the implementation.

| Item | Value |
|---|---|
| Events per request | 10 max |
| Wait between events | 500 ms |
| Station search radius | 3,000 m |
| Route candidates requested (limit) | 5 (the first is used) |

Each event costs a station lookup for the origin and the destination (Geocoding plus NearbySearch) plus one NAVITIME call. The half-second pause in the loop is what keeps those calls from firing back to back.

What changes, concretely, is the number of times you check. Departure times sit next to the events, so "how far can I get before this meeting" no longer needs to be looked up again.

## When not to use it

- **Long date ranges**: one request covers ten events, so anything beyond that is not returned. Split the range.
- **Travel that is not by train**: routing is fixed to `route_transit`. This is not for trips where driving or walking dominates.
- **Events with no location**: an empty location field falls back to home, which also lumps online meetings in with travel.
- **All-day events**: with no start time, routing assumes 9 a.m., so the arrival time will not match reality.
- **The "will I make it" check**: comparing the previous event's end time with the departure time lives in the `backend/cmd/dev/main.go` CLI, not in the web screen. The screen only puts the times side by side.
- **Authentication**: the authorization code is exchanged per request and no token is stored, so changing the date range means signing in again.

Listing travel times is where the current version stops; flagging a schedule that cannot be met still happens in the CLI.

## Takeaways

- Manual work here is really two jobs — choosing the origin and subtracting from the arrival time — and each can be automated on its own.
- Keeping the origin decision in one function stops the branching from multiplying as events are added.
- Using the calendar as the input means changes follow automatically.
- Avoid over-calling external APIs by fixing a request ceiling and a pause up front.

The same shape applies to any tool that fills in the gaps on a calendar.

## Related posts

- [A travel calendar in Go, Gorilla Mux, and React: how BookingButler is built](/en/post/20261115booking-butler-tech/)
- [BookingButler: automating business trip management with Google Calendar (in Japanese)](/post/20250711booking-buttler/)

---

**Building a scheduling or travel automation tool?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1993863)
