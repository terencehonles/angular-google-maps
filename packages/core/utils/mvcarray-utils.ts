/// <reference types="@types/googlemaps" />
import { Observable, fromEventPattern } from 'rxjs';

export function createMVCEventObservable<T>(array: google.maps.MVCArray<T>): Observable<MVCEvent<T>>{
  const eventNames = ['insert_at', 'remove_at', 'set_at'];
  return fromEventPattern(
    (handler: Function) => eventNames.map(eventName => array.addListener(eventName,
      (index: number, previous?: T) => handler.apply(array, [ {'newArr': array.getArray(), eventName, index, previous} as MVCEvent<T>]))),
    (handler: Function, evListeners: google.maps.MapsEventListener[]) => evListeners.forEach(evListener => evListener.remove()));
}

export type MvcEventType = 'insert_at' | 'remove_at' | 'set_at';

export interface MVCEvent<T> {
  newArr: T[];
  eventName: MvcEventType;
  index: number;
  previous?: T;
}
