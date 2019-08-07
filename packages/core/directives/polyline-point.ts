/// <reference types="@types/googlemaps" />
import { Directive, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

/**
 * AgmPolylinePoint represents one element of a polyline within a  {@link
 * AgmPolyline}
 */
@Directive({selector: 'agm-polyline-point'})
export class AgmPolylinePoint implements OnChanges {
  /**
   * The latitude position of the point.
   */
  @Input() public latitude: number;

  /**
   * The longitude position of the point;
   */
  @Input() public longitude: number;

  /**
   * This event emitter gets emitted when the position of the point changed.
   */
  @Output() positionChanged: EventEmitter<google.maps.LatLngLiteral> = new EventEmitter<google.maps.LatLngLiteral>();

  constructor() {}

  ngOnChanges(changes: SimpleChanges): any {
    if (changes['latitude'] || changes['longitude']) {
      const position = {
        lat: changes['latitude'] ? changes['latitude'].currentValue : this.latitude,
        lng: changes['longitude'] ? changes['longitude'].currentValue : this.longitude
      } as google.maps.LatLngLiteral;
      this.positionChanged.emit(position);
    }
  }
}
