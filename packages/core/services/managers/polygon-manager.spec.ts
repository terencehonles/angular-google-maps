/// <reference types="@types/googlemaps" />
import {NgZone} from '@angular/core';
import {TestBed, inject} from '@angular/core/testing';

import {AgmPolygon} from '../../directives/polygon';
import {GoogleMapsAPIWrapper} from '../google-maps-api-wrapper';
import {PolygonManager} from './polygon-manager';

export class MvcArrayMock<T> implements google.maps.MVCArray<T> {
  private vals: T[] = [];
  private listeners: {
    'remove_at': Function[];
    'insert_at': Function[];
    'set_at': Function[];
    [key: string]: Function[];
  } = {
    'remove_at': [] as Function[],
    'insert_at': [] as Function[],
    'set_at': [] as Function[],
  };
  clear(): void {
    for (let i = this.vals.length - 1; i >= 0; i--) {
        this.removeAt(i);
    }
  }
  getArray(): T[] {
    return [...this.vals];
  }
  getAt(i: number): T {
    return this.vals[i];
  }
  getLength(): number {
    return this.vals.length;
  }
  insertAt(i: number, elem: T): void {
    this.vals.splice(i, 0, elem);
    this.listeners.insert_at.map(listener => listener(i));
  }
  pop(): T {
    const deleted = this.vals.pop();
    this.listeners.remove_at.map(listener => listener(this.vals.length, deleted));
    return deleted;
  }
  push(elem: T): number {
    this.vals.push(elem);
    this.listeners.insert_at.map(listener => listener(this.vals.length - 1));
    return this.vals.length;
  }
  removeAt(i: number): T {
    const deleted = this.vals.splice(i, 1)[0];
    this.listeners.remove_at.map(listener => listener(i, deleted));
    return deleted;
  }
  setAt(i: number, elem: T): void {
    const deleted = this.vals[i];
    this.vals[i] = elem;
    this.listeners.set_at.map(listener => listener(i, deleted));
  }
  forEach(callback: (elem: T, i: number) => void): void {
    this.vals.forEach(callback);
  }
  addListener(eventName: string, handler: Function): google.maps.MapsEventListener {
    const listenerArr = this.listeners[eventName];
    listenerArr.push(handler);
    return {
        remove: () => {
            listenerArr.splice(listenerArr.indexOf(handler), 1);
        }
    };
  }

  bindTo(): never { throw new Error('Not implemented'); }
  changed(): never { throw new Error('Not implemented'); }
  get(): never { throw new Error('Not implemented'); }
  notify(): never { throw new Error('Not implemented'); }
  set(): never { throw new Error('Not implemented'); }
  setValues(): never { throw new Error('Not implemented'); }
  unbind(): never { throw new Error('Not implemented'); }
  unbindAll(): never { throw new Error('Not implemented'); }
}

describe('PolygonManager', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: NgZone, useFactory: () => new NgZone({enableLongStackTrace: true})},
        PolygonManager, AgmPolygon, {
          provide: GoogleMapsAPIWrapper,
          useValue: {
            createPolygon: jest.fn()
          }
        }
      ]
    });
  });

  describe('Create a new polygon', () => {
    it('should call the mapsApiWrapper when creating a new polygon',
       inject(
           [PolygonManager, GoogleMapsAPIWrapper],
           (polygonManager: PolygonManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newPolygon = new AgmPolygon(polygonManager);
             polygonManager.addPolygon(newPolygon);

             expect(apiWrapper.createPolygon).toHaveBeenCalledWith({
               clickable: true,
               draggable: false,
               editable: false,
               fillColor: undefined,
               fillOpacity: undefined,
               geodesic: false,
               paths: [],
               strokeColor: undefined,
               strokeOpacity: undefined,
               strokeWeight: undefined,
               visible: undefined,
               zIndex: undefined
             });
           }));
  });

  describe('Delete a polygon', () => {
    it('should set the map to null when deleting a existing polygon',
       inject(
           [PolygonManager, GoogleMapsAPIWrapper],
           (polygonManager: PolygonManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newPolygon = new AgmPolygon(polygonManager);

             const polygonInstance: any = {
              setMap: jest.fn()
             };
             (<jest.Mock>apiWrapper.createPolygon).mockReturnValue(Promise.resolve(polygonInstance));

             polygonManager.addPolygon(newPolygon);
             polygonManager.deletePolygon(newPolygon).then(() => {
               expect(polygonInstance.setMap).toHaveBeenCalledWith(null);
             });
           }));
  });

  describe('Path changes', () => {
    let newPolygon: AgmPolygon;
    let paths: google.maps.MVCArray<google.maps.MVCArray<google.maps.LatLng>>;
    const initLatLng = {lat: () => 15, lng: () => 15, toJSON: () => ({lat: 15, lng: 15})} as google.maps.LatLng;

    beforeEach(
      inject(
            [PolygonManager, GoogleMapsAPIWrapper],
            (polygonManager: PolygonManager, apiWrapper: GoogleMapsAPIWrapper) => {
        paths = new MvcArrayMock<google.maps.MVCArray<google.maps.LatLng>>();
        let path = new MvcArrayMock<google.maps.LatLng>();
        path.push(initLatLng);
        paths.push(path);

        const polygonInstance: any = {
          getPaths: () => paths,
          setMap: jest.fn(),
        };
        (<jest.Mock>apiWrapper.createPolygon).mockReturnValue(Promise.resolve(polygonInstance));
        newPolygon = new AgmPolygon(polygonManager);
        polygonManager.addPolygon(newPolygon);
    }));

    afterEach((done) => {
      inject(
        [PolygonManager],
        (polygonManager: PolygonManager) => {
          polygonManager.deletePolygon(newPolygon)
          .then(done);
      })();
    });

    it('should emit a path change when a path is added', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [1, 2];
        let expectationIndex = 0;
        expect.assertions(expectations.length);
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              newArr: [[{lat: 15, lng: 15}], ...Array(expectationIndex + 1).fill([])],
              eventName: 'insert_at',
              index: expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          paths.push(new MvcArrayMock());
          paths.push(new MvcArrayMock());
        });
      })();
    });

    it('should emit a path change when a path is removed', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [{index: 2, previous: [] as google.maps.LatLng[], newArr: [[{lat: 15, lng: 15}], []]},
                              {index: 0, previous: [initLatLng], newArr: [[]]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        // prepare the array
        paths.push(new MvcArrayMock());
        paths.push(new MvcArrayMock());
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'remove_at',
              ...expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          paths.pop();
          paths.removeAt(0);
        });
      })();
    });

    it('should emit a path change when a path is set', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [{index: 0, previous: [initLatLng], newArr: [Array(2).fill({lat: 15, lng: 15}), []]},
             {index: 1, previous: [] as google.maps.LatLng[], newArr: [Array(2).fill({lat: 15, lng: 15}), [{lat: 15, lng: 15}]]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        // prepare the array
        paths.push(new MvcArrayMock());
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'set_at',
              ...expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          const firstMvcArray = new MvcArrayMock<google.maps.LatLng>();
          firstMvcArray.push(initLatLng);
          firstMvcArray.push(initLatLng);
          paths.setAt(0, firstMvcArray);
          const secondMvcArray = new MvcArrayMock<google.maps.LatLng>();
          secondMvcArray.push(initLatLng);
          paths.setAt(1, secondMvcArray);
        });
      })();
    });

    it('should emit a path change when a point is added to a path', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [
          {pathIndex: 0, index: 1, newArr: [Array(2).fill({lat: 15, lng: 15})]},
          {pathIndex: 0, index: 2, newArr: [Array(3).fill({lat: 15, lng: 15})]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'insert_at',
              ...expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          paths.getAt(0).push(initLatLng);
          paths.getAt(0).push(initLatLng);
        });
      })();
    });

    it('should emit a path change when a point is removed from a path', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [
          {pathIndex: 0, index: 1, previous: initLatLng, newArr: [[{lat: 15, lng: 15}]]},
          {pathIndex: 0, index: 0, previous: initLatLng, newArr: [[] as google.maps.LatLngLiteral[]]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        // prepare the array
        paths.getAt(0).push(initLatLng);
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'remove_at',
              ...expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          paths.getAt(0).pop();
          paths.getAt(0).removeAt(0);
        });
      })();
    });

    it('should emit a path change when a point is added to an added path', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [
          {index: 1, newArr: [[{lat: 15, lng: 15}], []]},
          {pathIndex: 1, index: 0, newArr: [[{lat: 15, lng: 15}], [{lat: 15, lng: 15}]]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        // prepare the array
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'insert_at',
              ...expectations[expectationIndex++],
            });
            if (expectationIndex === expectations.length) {
              done();
            }
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          paths.push(new MvcArrayMock<google.maps.LatLng>());
          paths.getAt(1).push(initLatLng);
        });
      })();
    });

    it('should not emit a path change when a point is added to a removed path', (done) => {
      inject([PolygonManager], (polygonManager: PolygonManager) => {
        const expectations = [{index: 0, newArr: [[]] as google.maps.LatLngLiteral[][]}];
        let expectationIndex = 0;
        expect.assertions(expectations.length);

        // prepare the array
        polygonManager.createPathEventObservable(newPolygon)
        .then(paths$ => {
          paths$.subscribe((polygonPathEvent) => {
            expect(polygonPathEvent).toEqual({
              eventName: 'removed_at',
              ...expectations[expectationIndex++],
            });
          }, fail /* shouldn't have errors */, fail /* shouldn't finish */);
          const removedPath = paths.pop();
          removedPath.pop();
          done();
        });
      })();
    });
  });
});
