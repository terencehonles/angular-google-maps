/// <reference types="@types/googlemaps" />
import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { AgmPolyline, PathEvent } from '../../directives/polyline';
import { AgmPolylinePoint } from '../../directives/polyline-point';
import { createMVCEventObservable } from '../../utils/mvcarray-utils';
import { GoogleMapsAPIWrapper } from '../google-maps-api-wrapper';

@Injectable()
export class PolylineManager {
  private _polylines: Map<AgmPolyline, Promise<google.maps.Polyline>> =
      new Map<AgmPolyline, Promise<google.maps.Polyline>>();

  constructor(private _mapsWrapper: GoogleMapsAPIWrapper, private _zone: NgZone) {}

  private static _convertPoints(line: AgmPolyline): google.maps.LatLngLiteral[] {
    const path = line._getPoints().map((point: AgmPolylinePoint) => {
      return {lat: point.latitude, lng: point.longitude} as google.maps.LatLngLiteral;
    });
    return path;
  }

  addPolyline(line: AgmPolyline) {
    const path = PolylineManager._convertPoints(line);
    const polylinePromise = this._mapsWrapper.createPolyline({
      clickable: line.clickable,
      draggable: line.draggable,
      editable: line.editable,
      geodesic: line.geodesic,
      strokeColor: line.strokeColor,
      strokeOpacity: line.strokeOpacity,
      strokeWeight: line.strokeWeight,
      visible: line.visible,
      zIndex: line.zIndex,
      path: path,
    });
    this._polylines.set(line, polylinePromise);
  }

  updatePolylinePoints(line: AgmPolyline): Promise<void> {
    const path = PolylineManager._convertPoints(line);
    const m = this._polylines.get(line);
    if (m == null) {
      return Promise.resolve();
    }
    return m.then((l: google.maps.Polyline) => { return this._zone.run(() => { l.setPath(path); }); });
  }

  setPolylineOptions(line: AgmPolyline, options: {[propName: string]: any}):
      Promise<void> {
    return this._polylines.get(line).then((l: google.maps.Polyline) => { l.setOptions(options); });
  }

  deletePolyline(line: AgmPolyline): Promise<void> {
    const m = this._polylines.get(line);
    if (m == null) {
      return Promise.resolve();
    }
    return m.then((l: google.maps.Polyline) => {
      return this._zone.run(() => {
        l.setMap(null);
        this._polylines.delete(line);
      });
    });
  }

  private async getMVCPath(agmPolyline: AgmPolyline): Promise<google.maps.MVCArray<google.maps.LatLng>> {
    const polyline = await this._polylines.get(agmPolyline);
    return polyline.getPath();
  }

  async getPath(agmPolyline: AgmPolyline): Promise<google.maps.LatLng[]> {
    return (await this.getMVCPath(agmPolyline)).getArray();
  }

  createEventObservable<T>(eventName: string, line: AgmPolyline): Observable<T> {
    return new Observable((observer: Observer<T>) => {
      this._polylines.get(line).then((l: google.maps.Polyline) => {
        l.addListener(eventName, (e: T) => this._zone.run(() => observer.next(e)));
      });
    });
  }

  async createPathEventObservable(line: AgmPolyline): Promise<Observable<PathEvent>> {
    const mvcPath = await this.getMVCPath(line);
    return createMVCEventObservable(mvcPath);
  }
}
