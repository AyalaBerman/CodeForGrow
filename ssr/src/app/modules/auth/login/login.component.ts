import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AppService,
  AuthService,
  SeoService,
  StateService
} from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';
import { IUser } from 'src/app/interface';
@Component({
  templateUrl: 'login.component.html'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private Auth: AuthService;
  public credentials = {
    email: '',
    password: '',
    rememberMe: false
  };
  public submitted = false;
  public appConfig: any;
  public returnUrl = '';

  constructor(
    auth: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    @Inject(StateService) private store: StateService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private appService: AppService
  ) {
    this.Auth = auth;
    this.appConfig = this.store.getState('config');
    this.seoService.setMetaTitle('Login');
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      let currentUrl = localStorage.getItem('currentUrl');
      if (currentUrl && currentUrl === '/auth/sign-up') currentUrl = '/home';
      this.returnUrl =
        this.route.snapshot.queryParams['returnUrl'] ||
        currentUrl ||
        '/users/dashboard';
      if (this.Auth.getAccessToken()) {
        this.router.navigate(['/']);
      }
    }
  }

  login(frm: any) {
    this.submitted = true;
    if (frm.invalid) {
      return;
    }
    this.credentials.email = this.credentials.email
      .toLowerCase()
      .replace(/\s+/g, '');
    this.Auth.login(this.credentials)
      .then((resp: IUser) => {
        if (resp && resp._id) {
          this.router.navigateByUrl(this.returnUrl, {
            state: {
              current: resp
            }
          });
        }
      })
      .catch((err) => {
        if (err) {
          return this.appService.toastError(err);
        }
        return this.appService.toastError();
      });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const target = document.getElementById('email-input');
      if (target) {
        target.addEventListener(
          'paste',
          (event: any) => {
            event.preventDefault();
            const clipboard = event.clipboardData,
              text = clipboard.getData('Text');
            event.target.value = text.trim();
            this.credentials.email = text.trim();
          },
          false
        );
      }
    }
  }
}
