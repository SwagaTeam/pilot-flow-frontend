import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/** An editor owns a draft and its captured ETag. A different entity needs a fresh editor. */
@Injectable()
export class EntityRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    const keys = new Set([...Object.keys(future.params), ...Object.keys(current.params)]);
    return (
      future.routeConfig === current.routeConfig &&
      [...keys].every((key) => future.params[key] === current.params[key]) &&
      future.queryParamMap.get('product') === current.queryParamMap.get('product')
    );
  }
}
