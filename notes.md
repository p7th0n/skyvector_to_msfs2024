# Feedback Notes

1. The XML declaration is invalid

Our code

```xml
<?xml version="2.0" encoding="UTF-8"?>
``

MSFS requires

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

2. <AppVersionMajor> must be 10 or greater

Our code

```xml
<AppVersionMajor>1</AppVersionMajor>
```

Correct

```xml
<AppVersionMajor>10</AppVersionMajor>
```

3. Waypoint numbering must start at WP1

Our first waypoint

```xml
<ATCWaypoint id="WP2">
```

But MSFS expects sequential numbering starting at WP1.

Correct sequence:

WP1
WP2
WP3
