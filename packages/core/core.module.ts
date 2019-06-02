import {ModuleWithProviders, NgModule} from '@angular/core';

import {AgmCircle} from './directives/circle';
import {AgmDataLayer} from './directives/data-layer';
import {AgmFitBounds} from './directives/fit-bounds';
import {AgmInfoWindow} from './directives/info-window';
import {AgmKmlLayer} from './directives/kml-layer';
import {AgmMap} from './directives/map';
import {AgmMarker} from './directives/marker';
import {AgmPolygon} from './directives/polygon';
import {AgmPolylinePoint} from './directives/polyline-point';
import {AgmPolyline} from './directives/polyline';
import {AgmRectangle} from './directives/rectangle';

import {LazyMapsAPILoader} from './services/maps-api-loader/lazy-maps-api-loader';
import {LAZY_MAPS_API_CONFIG, LazyMapsAPILoaderConfigLiteral} from './services/maps-api-loader/lazy-maps-api-loader';
import {MapsAPILoader} from './services/maps-api-loader/maps-api-loader';

import {BROWSER_GLOBALS_PROVIDERS} from './utils/browser-globals';

/**
 * @internal
 */
export function coreDirectives() {
  return [
    AgmMap, AgmMarker, AgmInfoWindow, AgmCircle, AgmRectangle,
    AgmPolygon, AgmPolyline, AgmPolylinePoint, AgmKmlLayer,
    AgmDataLayer, AgmFitBounds
  ];
}

/**
 * The angular-google-maps core module. Contains all Directives/Services/Pipes
 * of the core module. Please use `AgmCoreModule.forRoot()` in your app module.
 */
@NgModule({declarations: coreDirectives(), exports: coreDirectives()})
export class AgmCoreModule {
  /**
   * Please use this method when you register the module at the root level.
   */
  static forRoot(lazyMapsAPILoaderConfig?: LazyMapsAPILoaderConfigLiteral): ModuleWithProviders {
    return {
      ngModule: AgmCoreModule,
      providers: [
        ...BROWSER_GLOBALS_PROVIDERS, {provide: MapsAPILoader, useClass: LazyMapsAPILoader},
        {provide: LAZY_MAPS_API_CONFIG, useValue: lazyMapsAPILoaderConfig}
      ],
    };
  }
}
