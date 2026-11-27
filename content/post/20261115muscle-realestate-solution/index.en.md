---
title: "Reversing the Order of House Hunting: Designing a Gym-First Search"
date: 2026-11-15T12:10:00+09:00
draft: false
tags: [Go, React, PostGIS, commute, real-estate, engineering]
summary: "House hunting starts with the office; the gym comes after the move. Muscle Real Estate flips that order into four stages: facilities, commute area, gym, property. The design, its trade-offs, and what is still mock."
---

## Every move means finding a new gym

When you decide to move, what do you start with? For most people it is the office and the commute. The gym is something you look for once you have settled in.

For anyone who trains daily, the distance to the gym weighs as much as the commute. So you shortlist three apartments, then check the nearest gym for each one: is it open 24 hours, does it have a pool, is there a sauna. That work repeats for every candidate on the list.

**Muscle Real Estate** reverses the order. Pick the gym first, narrow the area by commute, then look for properties around that gym. This post is about what changes when you swap the order, and where the design had to compromise.

## Why existing tools fall short

| Tool | What it does | Where it stops |
|---|---|---|
| Real-estate portals | Filter by station, commute time, rent | No axis for gym facilities; the gym is assumed to come later |
| Map apps | Show where gyms and properties are | You measure the distance by hand, for every candidate |
| A spreadsheet | Compare on any axis you like | You collect the data yourself, and it goes stale |
| Gym review sites | Describe equipment and atmosphere | Nothing about living next to it |

What is missing is a screen that treats gym facilities and housing conditions as one problem.

## The design

The search is fixed at four stages:

1. **Facilities**: narrow gyms by nine equipment types.
2. **Commute area**: choose a tolerable time and a travel mode.
3. **Gym**: pick one.
4. **Property**: look within 1 km of it.

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: start from the office</strong>
    <div class="diagram-box">Pick the office and the commute time</div>
    <div class="diagram-box">Narrow the area, then find properties</div>
    <div class="diagram-box">Look for a gym after moving in</div>
    <div class="diagram-box">Check gym distance on a map, per candidate</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: start from the gym</strong>
    <div class="diagram-box">Narrow gyms by facilities (nine types)</div>
    <div class="diagram-box">Decide the area by commute time</div>
    <div class="diagram-box">Pick a gym</div>
    <div class="diagram-box">See properties within 1 km on the same screen</div>
  </div>
</div>
<p class="diagram-caption">Figure 1: The house-hunting order, before and after</p>
</div>

Three decisions shaped it:

- **Make the order the API's arguments.** The screen then only tracks which stage you are on.
- **Keep every filter adjustable.** The tolerable time is `max_time`, the travel mode is `mode`, and both can change per request.
- **Make commute calculation replaceable.** Define the external API's shape first and fill in the body later.

The biggest trade-off is that filtering early removes candidates. Pick three facilities and the result can be empty. Facilities are therefore ANDed, and the chips re-run the search as soon as one is removed.

## Implementation notes

### 1. Put the four stages in URLs

Once the order is fixed, the endpoints line up with it.

```bash
# 1. Narrow gyms by facilities
curl "http://localhost:3001/api/gyms/search?facilities=プール,サウナ"

# 2. Get commutable areas (defaults: 30 minutes, transit)
curl "http://localhost:3001/api/commute/areas?origin=新宿駅&max_time=30&mode=transit"

# 3. Search properties around the chosen gym (default radius: 1,000 m)
curl "http://localhost:3001/api/properties/search?lat=35.6586&lng=139.7008&radius=1000"
```

Each stage can be called on its own, so the search can be checked without building UI. `docs/api-implementation-log-2024-11-29.md` records that every endpoint at this stage had been verified.

### 2. AND the facility filters

"Has both a pool and a sauna" is an AND, not an OR. `server/internal/repository/gym_repository.go` repeats `$n = ANY(facilities)` once per condition.

```go
// server/internal/repository/gym_repository.go (ComplexSearch)
for _, facility := range facilities {
    facilityConditions = append(facilityConditions,
        fmt.Sprintf("$%d = ANY(facilities)", argIndex))
    args = append(args, facility)
    argIndex++
}
conditions = append(conditions, "("+strings.Join(facilityConditions, " AND ")+")")
```

The UI offers nine chips, listed in `availableFacilities` in `client/src/components/GymSearch.tsx`: 24-hour access, cardio machines, free weights, pool, sauna, studio classes, spa, bathing facilities, and a golf range. Pressing a chip sends that array as `facilities`.

### 3. Cut the commute area by time

`GET /api/commute/areas` holds five fixed stations (Shibuya, Shinjuku, Ikebukuro, Shinagawa, Ebisu) and returns the ones within `max_time`. The mode adjustment is effectively the whole body of the endpoint.

```go
// server/internal/service/commute_service.go (getMockCommutableAreas)
switch mode {
case "driving":
    adjustedTime = adjustedTime / 2
case "walking":
    adjustedTime = adjustedTime * 3
case "bicycling":
    adjustedTime = adjustedTime * 2
}

if adjustedTime <= maxTime {
    area.CommuteTime = adjustedTime
    filteredAreas = append(filteredAreas, area)
}
```

`max_time` defaults to 30 minutes and `mode` to `transit`. `docs/api-implementation-log` records 30, 45, 60, and 90 minutes as the candidate tolerances. Since the value arrives as a query parameter, adding options does not change the API.

## Results

The back-and-forth of checking a gym for each candidate became a single screen. Selecting a gym lists properties within 1 km, with rent, size, and floor-plan filters, while the right panel shows the property count, average rent, and shortest distance.

That is as far as it goes today. To be precise:

- **Commute time is mock data.** `commute_service.go` does not call the real API even when a key is set, and the UI does not display commute minutes.
- **The UI covers two of the four stages.** The frontend calls gym search and property search; the commute endpoints are not connected yet.
- **The map is a placeholder.** `client/src/components/MapView.tsx` renders "Google Maps integration planned" and does not draw positions.
- **The data is small.** 16 gyms across Tokyo, Osaka, Nagoya, Fukuoka, and Sapporo, and 15 seeded properties.

There is no performance claim to make yet. The honest result is a design-level one: reversing the order removes a class of mistakes that only surface after you move in.

## When not to use it

- **You have not chosen a gym.** Without a starting point the flow does not apply, and a reverse path from area to gym would be needed.
- **Your facilities are niche.** The vocabulary is fixed at nine types, so personal-training studios or women-only gyms cannot be expressed.
- **You need live data.** Real properties require the external property API, and real commute times require the Distance Matrix API.
- **You are car-dependent.** The commute model is station-based, which fits poorly where stations are not the unit of travel.

What remains is the substance rather than the order: real commute calculation, map rendering, property data, and gym data collection. The four-stage design survives all of them.

## Takeaways

- Reversing the priority changes how conditions are held; gym facilities become first-class search criteria.
- Encoding the order in the API leaves the screen tracking only the current stage.
- If a stage has no implementation, label it as mock and build the shape first, but never present it as a measurement.

This applies beyond housing: any service that treats something as "find it later" can become a different product by swapping the order.

## Related posts

- [Choosing a home from the gym outward: a Go (Gin) + React API for commute-aware search](/en/post/20261115muscle-realestate-tech/)
- [Choosing where to live from the gym: building Muscle Real Estate with Go and React (in Japanese)](/post/muscle-realestate/)

---

**Want to redesign a service around the order people search in?**

I take on technical consulting and development support.

[Hire me on Coconala](https://coconala.com/users/1117897)
