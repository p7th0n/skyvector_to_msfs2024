
import re

def skyvector_to_decimal(coord):
    match = re.match(r"(\d{2,3})(\d{2})(\d{2})([NSEW])", coord)
    if not match:
        return None

    deg, minutes, seconds, hemi = match.groups()
    deg = int(deg)
    minutes = int(minutes)
    seconds = int(seconds)

    decimal = deg + minutes/60 + seconds/3600

    if hemi in ["S", "W"]:
        decimal = -decimal

    return decimal

def convert_flightplan(text):
    tokens = text.split()
    output = []

    for t in tokens:
        if re.match(r"\d{6}[NS]\d{7}[EW]", t):  
            # Combined lat+lon (rare)
            lat = t[:7]
            lon = t[7:]
            output.append(f"{skyvector_to_decimal(lat)},{skyvector_to_decimal(lon)}")
        elif re.match(r"\d{6}[NS]", t):  
            # Latitude only
            lat = t
            continue
        elif re.match(r"\d{7}[EW]", t):
            # Longitude only
            lon = t
            output.append(f"{skyvector_to_decimal(lat)},{skyvector_to_decimal(lon)}")
        else:
            # Airport, VOR, intersection
            output.append(t)

    return "\n".join(output)


