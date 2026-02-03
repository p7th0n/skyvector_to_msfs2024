# Feedback Notes

## Airport waypoints

.PLN fails because MSFS 2024 requires airport waypoints to include <WorldPosition> — even for airports.

Airport waypoints (P34, N68) are missing <WorldPosition>
In MSFS 2020, airports could omit <WorldPosition> because the sim looked them up by ICAO.

In MSFS 2024, the planner requires every waypoint, including airports, to contain:

```xml
<WorldPosition>lat,lon,alt</WorldPosition>
```

our airport entries look like this:

```xml
<ATCWaypoint id="P34">
  <ATCWaypointType>Airport</ATCWaypointType>
  <ICAO>
    <ICAOIdent>P34</ICAOIdent>
  </ICAO>
</ATCWaypoint>
```

MSFS 2024 expects:

```xml
<ATCWaypoint id="P34">
  <ATCWaypointType>Airport</ATCWaypointType>
  <WorldPosition>40.536111,-77.386111,0</WorldPosition>
  <ICAO>
    <ICAOIdent>P34</ICAOIdent>
  </ICAO>
</ATCWaypoint>
```

Same for N68.

The MSFS 2024 planner:

- Does not automatically look up airport coordinates
- Requires explicit LLA for every waypoint
- Validates that the first airport’s <WorldPosition> matches <DepartureLLA>
- Validates that the last airport’s <WorldPosition> matches <DestinationLLA>
- Your file fails that rule.
