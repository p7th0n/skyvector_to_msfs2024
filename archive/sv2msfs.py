#!/usr/bin/env python3
import re
import sys
import argparse
from xml.sax.saxutils import escape

LAT_RE   = re.compile(r"^(\d{2})(\d{2})(\d{2})([NS])$")
LON_RE   = re.compile(r"^(\d{3})(\d{2})(\d{2})([EW])$")
COMBO_RE = re.compile(r"^(\d{6}[NS]\d{7}[EW])$")

def skyvector_to_decimal(coord: str) -> float:
    m_lat = LAT_RE.match(coord)
    m_lon = LON_RE.match(coord)

    if not (m_lat or m_lon):
        raise ValueError(f"Invalid coordinate format: {coord}")

    if m_lat:
        deg, minutes, seconds, hemi = m_lat.groups()
    else:
        deg, minutes, seconds, hemi = m_lon.groups()

    deg = int(deg)
    minutes = int(minutes)
    seconds = int(seconds)

    if not (0 <= minutes < 60 and 0 <= seconds < 60):
        raise ValueError(f"Invalid minutes/seconds in coordinate: {coord}")

    if hemi in ("N", "S") and not (0 <= deg <= 90):
        raise ValueError(f"Latitude degrees out of range: {coord}")
    if hemi in ("E", "W") and not (0 <= deg <= 180):
        raise ValueError(f"Longitude degrees out of range: {coord}")

    decimal = deg + minutes/60 + seconds/3600

    if hemi in ("S", "W"):
        decimal = -decimal

    return round(decimal, 6)


def parse_source_route(text: str):
    tokens = text.split()
    waypoints = []
    i = 0

    while i < len(tokens):
        t = tokens[i].strip()

        # Combined GPS token
        if COMBO_RE.match(t):
            lat = t[:7]
            lon = t[7:]
            lat_dec = skyvector_to_decimal(lat)
            lon_dec = skyvector_to_decimal(lon)
            waypoints.append(("GPS", lat_dec, lon_dec))
            i += 1
            continue

        # Separate LAT + LON tokens
        if LAT_RE.match(t):
            if i + 1 >= len(tokens):
                raise ValueError(f"Latitude '{t}' missing longitude.")
            lon_tok = tokens[i+1].strip()
            if not LON_RE.match(lon_tok):
                raise ValueError(f"Latitude '{t}' not followed by valid longitude.")
            lat_dec = skyvector_to_decimal(t)
            lon_dec = skyvector_to_decimal(lon_tok)
            waypoints.append(("GPS", lat_dec, lon_dec))
            i += 2
            continue

        # Named waypoint
        waypoints.append(("NAMED", t.upper(), None))
        i += 1

    return waypoints


def generate_pln(waypoints):
    # First and last named waypoints become departure/arrival
    dep = next((w for w in waypoints if w[0] == "NAMED"), None)
    arr = next((w for w in reversed(waypoints) if w[0] == "NAMED"), None)

    dep_id = dep[1] if dep else "UNKNOWN"
    arr_id = arr[1] if arr else "UNKNOWN"

    # DepartureLLA and DestinationLLA must be real coordinates
    # Use first and last GPS fixes if available
    gps_points = [w for w in waypoints if w[0] == "GPS"]

    if gps_points:
        dep_lat, dep_lon = gps_points[0][1], gps_points[0][2]
        arr_lat, arr_lon = gps_points[-1][1], gps_points[-1][2]
    else:
        # Fallback: zeroes (MSFS will still load)
        dep_lat = dep_lon = arr_lat = arr_lon = 0.0

    xml = []
    xml.append('<?xml version="1.0" encoding="UTF-8"?>')
    xml.append('<SimBase.Document Type="AceXML" version="2,0">')
    xml.append('  <Descr>FlightPlan</Descr>')
    xml.append('  <FlightPlan.FlightPlan>')
    xml.append('    <AppVersion>')
    xml.append('      <AppVersionMajor>1</AppVersionMajor>')
    xml.append('      <AppVersionMinor>0</AppVersionMinor>')
    xml.append('    </AppVersion>')
    xml.append(f'    <Title>{escape(dep_id)} to {escape(arr_id)}</Title>')
    xml.append('    <FPType>VFR</FPType>')
    xml.append('    <RouteType>Direct</RouteType>')
    xml.append('    <CruisingAlt>3500</CruisingAlt>')
    xml.append(f'    <DepartureID>{escape(dep_id)}</DepartureID>')
    xml.append(f'    <DepartureLLA>{dep_lat},{dep_lon},0</DepartureLLA>')
    xml.append(f'    <DestinationID>{escape(arr_id)}</DestinationID>')
    xml.append(f'    <DestinationLLA>{arr_lat},{arr_lon},0</DestinationLLA>')
    xml.append('    <ATCWaypointList>')

    for idx, wp in enumerate(waypoints):
        if wp[0] == "NAMED":
            ident = wp[1]
            xml.append(f'      <ATCWaypoint id="{escape(ident)}">')
            xml.append('        <ATCWaypointType>Airport</ATCWaypointType>')
            xml.append('        <ICAO>')
            xml.append(f'          <ICAOIdent>{escape(ident)}</ICAOIdent>')
            xml.append('        </ICAO>')
            xml.append('      </ATCWaypoint>')
        else:
            lat = wp[1]
            lon = wp[2]
            xml.append(f'      <ATCWaypoint id="WP{idx+1}">')
            xml.append('        <ATCWaypointType>User</ATCWaypointType>')
            xml.append(f'        <WorldPosition>{lat},{lon},0</WorldPosition>')
            xml.append('      </ATCWaypoint>')

    xml.append('    </ATCWaypointList>')
    xml.append('  </FlightPlan.FlightPlan>')
    xml.append('</SimBase.Document>')

    return "\n".join(xml)


def main():
    parser = argparse.ArgumentParser(
        description="Convert SkyVector Source Route into MSFS 2024 .PLN format."
    )
    parser.add_argument("input", nargs="?", help="SkyVector source route text or file path.")
    parser.add_argument("-f", "--file", action="store_true", help="Treat input as filename.")

    args = parser.parse_args()

    if not args.input:
        print("Error: No input provided.", file=sys.stderr)
        sys.exit(1)

    if args.file:
        with open(args.input, "r") as f:
            text = f.read()
    else:
        text = args.input

    waypoints = parse_source_route(text)
    pln = generate_pln(waypoints)
    print(pln)


if __name__ == "__main__":
    main()
