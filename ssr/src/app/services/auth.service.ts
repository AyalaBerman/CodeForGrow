import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { STATE, StateService } from './state-service';
import { APIRequest } from './api-request';
import { HttpClient } from '@angular/common/http';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { SocketService } from './socket.service';
import { IUser } from '../interface';
@Injectable({
  providedIn: 'root'
})
export class AuthService extends APIRequest {
  private accessToken = '';
  private currentUser: any;
  private userLoaded = new Subject<any>();
  public userLoaded$ = this.userLoaded.asObservable();

  currentUserSubject = new ReplaySubject<IUser | null>(1);

  // ensure do not load if it is in the promise
  // because many component use get current user function
  private _getUser: any;
  isServer = false;
  isBrowser = false;
  constructor(
    private stateService: StateService,
    private myHttpService: HttpClient,
    @Inject(SsrCookieService) private mycookie: SsrCookieService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private socket: SocketService
  ) {
    super(myHttpService);
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  isFetched(data: any): boolean {
    return typeof data !== 'undefined';
  }

  async initAppGetCurrentUser() {
    const token = this.mycookie.get('accessToken');
    if (!token) {
      this.currentUserSubject.next(null);
      return null;
    }
    if (this.isServer) {
      return this.getCurrentUser();
    } else {
      if (this.stateService.hasState(STATE.CURRENT_USER)) {
        this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
        this.socket.reconnect();
        if (this.isFetched(this.currentUser)) {
          this.currentUserSubject.next(this.currentUser);
        }
        return this.currentUser;
      } else {
        return this.getCurrentUser();
      }
    }
    // if (this.isBrowser) {
    //   const token = this.mycookie.get('accessToken');
    //   if (!token) return null;
    //   const baseApiEndpoint = this.getBaseApiEndpoint();
    //   const updatedUrl = `${baseApiEndpoint}/users/me`;
    //   return lastValueFrom(this.myHttpService.get(updatedUrl))
    //     .then((resp: any) => {
    //       this.currentUser = resp.data;
    //       this.mycookie.set('isLoggedin', 'yes');
    //       this.mycookie.set('timeZone', resp.data.timezone);
    //       this.userLoaded.next(resp.data);
    //       this.stateService.saveState('currentUser', this.currentUser);
    //       return this.currentUser;
    //     })
    //     .catch(() => {
    //       this.mycookie.delete('accessToken');
    //       this.mycookie.delete('isLoggedin');
    //       return null;
    //     });
    // }

  }

  async getCurrentUser() {
    if (this.isFetched(this.currentUser)) {
      this.currentUserSubject.next(this.currentUser);
      this.stateService.saveState('currentUser', this.currentUser);
      return new Promise((resolve) => resolve(this.currentUser));
    }

    if (this._getUser && typeof this._getUser.then === 'function') {
      return this._getUser;
    }

    this._getUser = await this.get('/users/me').then((resp: any) => {
      this.currentUser = resp.data;
      this.mycookie.set('isLoggedin', 'yes', { path: '/' });
      this.mycookie.set('timeZone', resp.data.timezone, { path: '/' });
      this.userLoaded.next(resp.data);
      this.stateService.saveState('currentUser', this.currentUser);
      this.socket.reconnect();
      this.currentUserSubject.next(this.currentUser);
      return this.currentUser;
    }).catch(() => {
      this.mycookie.delete('accessToken', '/');
      this.mycookie.delete('isLoggedin', '/');
      this.stateService.removeState(STATE.CURRENT_USER);
      this.currentUserSubject.next(null);
      return null;
    });
    return this._getUser;
  }

  updateCurrentUser(current: any) {
    this.currentUser = { ...this.currentUser, ...current };
  }

  login(credentials: any): Promise<any> {
    return this.post('/auth/login', credentials).then((resp: any) => {
      this.mycookie.set('isLoggedin', 'yes', { path: '/' });
      this.mycookie.set('accessToken', resp.data.token, { path: '/' });
      return this.getCurrentUser();
    });
  }

  register(info: any): Promise<any> {
    return this.post('/auth/register', info);
  }

  getAccessToken(): any {
    if (!this.accessToken) {
      this.accessToken = this.mycookie.get('accessToken') || '';
    }

    return this.accessToken;
  }

  forgot(email: string): Promise<any> {
    return this.post('/auth/forgot', { email });
  }

  removeToken() {
    this.mycookie.delete('accessToken', '/');
    this.mycookie.delete('isLoggedin', '/');
  }

  isLoggedin() {
    return this.mycookie.get('isLoggedin') === 'yes';
  }

  registerTutor(info: any): Promise<any> {
    return this.post('/tutors/register', info);
  }
}
