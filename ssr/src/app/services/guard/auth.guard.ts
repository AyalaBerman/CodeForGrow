import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private Auth: AuthService) { }

  canActivate() {
    // const currentUser = this.stateService.getState(STATE.CURRENT_USER) as IUser;
    // if (!this.Auth.isLoggedin() || !currentUser || !currentUser._id) {
    //   this.router.navigate(['/auth/login']);
    //   return false;
    // }
    // return true;
    return this.Auth.currentUserSubject.pipe(
      map((userInfo) => {
        if (userInfo) {
          return true;
        }
        return this.router.parseUrl('/auth/login');
      })
    );
  }
}
