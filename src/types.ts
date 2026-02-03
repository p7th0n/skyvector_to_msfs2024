export type WaypointType = 'GPS' | 'NAMED';

export interface Waypoint {
  type: WaypointType;
  name?: string;
  latitude?: number;
  longitude?: number;
}

export interface FlightPlan {
  title: string;
  departureId: string;
  arrivalId: string;
  departureLLA: string;
  destinationLLA: string;
  waypoints: Waypoint[];
}

export interface ConversionError {
  message: string;
  position?: number;
  input?: string;
}