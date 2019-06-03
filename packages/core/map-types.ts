/// <reference types="@types/googlemaps" />

/**
 * MouseEvent gets emitted when the user triggers mouse events on the map.
 */
export interface MouseEvent { coords: google.maps.LatLngLiteral; }

/** Options for the restricting the bounds of the map. */
export interface MapRestriction {
  latLngBounds: google.maps.LatLngBounds|google.maps.LatLngBoundsLiteral;
  strictBounds?: boolean;
}
