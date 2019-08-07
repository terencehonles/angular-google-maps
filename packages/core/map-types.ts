/// <reference types="@types/googlemaps" />

export interface BicyclingLayerOptions{
  visible: boolean;
}

export interface TransitLayerOptions{
  visible: boolean;
}

/**
 * MouseEvent gets emitted when the user triggers mouse events on the map.
 */
export interface MouseEvent {
  coords: google.maps.LatLngLiteral;
  placeId?: string;
}
