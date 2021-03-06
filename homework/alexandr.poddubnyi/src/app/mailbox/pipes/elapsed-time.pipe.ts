import {
  OnDestroy,
  ChangeDetectorRef,
  Pipe,
  PipeTransform
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

@Pipe({
  name: 'elapsedTime',
  pure: false
})
export class ElapsedTimePipe implements PipeTransform, OnDestroy {
  private async: AsyncPipe;

  private isDestroyed = false;
  private value: Date;
  private timer: Observable<string>;

  constructor(ref: ChangeDetectorRef) {
    this.async = new AsyncPipe(ref);
  }

  transform(obj: any, ...args: any[]): any {
    if (obj == null) { return obj; }

    if (!(obj instanceof Date)) {
      const date = obj;
      obj = new Date(obj);
      if (obj.toString() === 'Invalid Date') {
        console.error(`ElapsedTimePipe works only with valid Dates or strings/numbers what can be transformed to Date type, error on "${date}"`);
        return obj;
      }
    }

    this.value = obj;

    if (!this.timer) {
      this.timer = this.getObservable();
    }

    return this.async.transform(this.timer);
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    // on next interval, will complete
  }

  private getObservable() {
    return Observable
      .of(1)
      .repeatWhen(notifications => {
        // for each next raised by the source sequence, map it to the result of the returned observable
        return notifications.mergeMap((x, i) => {
          const sleep = i < 60 ? 1000 : 30000;
          return Observable.timer(sleep);
        });
      })
      .takeWhile(_ => !this.isDestroyed)
      .map((x, i) => this.elapsed());
  };

  private elapsed(): string {
    const now = new Date().getTime();

    // time since message was sent in seconds
    // const delta = (now - this.value.getTime()) / 1000 - this.value.getTimezoneOffset() * 60;
    const delta = (now - this.value.getTime()) / 1000;

    // format string
    if (delta < 60) { // sent in last minute
      return `${Math.floor(delta)}s ago`;
    } else if (delta < 3600) { // sent in last hour
      return `${Math.floor(delta / 60)}m ago`;
    } else if (delta < 86400) { // sent on last day
      return `${Math.floor(delta / 3600)}h ago`;
    } else { // sent more than one day ago
      return `${Math.floor(delta / 86400)}d ago`;
    }
  }
}
