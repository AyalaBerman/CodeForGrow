import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  config: SocketIoConfig = {
    url: environment.socketUrl,
    options: {
      query: {},
      transports: ['websocket']
    }
  };
  cookieService = inject(SsrCookieService);
  socket: Socket | null = null;
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }
  getMessage(cb: Function) {
    return this.socket && this.socket.on('new_message', (data: any) => {
      cb(data);
    });
  }

  connect() {
    return this.socket && this.socket.connect();
  }

  disconnect() {
    return this.socket && this.socket.disconnect();
  }

  emit(eventName: string, data: any, cb?: Function) {
    this.socket && this.socket.emit(eventName, data, (resp: any) => {
      cb && cb(resp);
    });
  }

  on(event: string, handle: Function) {
    this.socket && this.socket.on(event, handle);
  }

  off(event: any, cb: Function = () => { return }) {
    this.socket && this.socket.removeListener(event, cb);
  }

  async reconnect() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.socket !== null && this.socket instanceof Socket) {
        return this.socket;
      } else {
        const config: SocketIoConfig = {
          url: environment.socketUrl,

          options: {
            transports: ['websocket'],
            query: {
              token: this.cookieService.get('accessToken')
            }
          }
        };
        this.socket = new Socket(config);
        return this.socket;
      }
    }
  }
}
