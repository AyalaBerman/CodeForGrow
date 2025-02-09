import { Component, OnInit } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartService, STATE, StateService } from './services';
import { TranslateService } from '@ngx-translate/core';
import { IUser } from './interface';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import * as jQuery from 'jquery';
// declare let $: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'angular-bootstrap';
  footerUrl = 'https://www.ganatan.com/';
  footerLink = 'www.ganatan.com';
  config: any;
  currentUser: IUser;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private stateService: StateService,
    private translate: TranslateService,
    private cartService: CartService,
    private cookieService: SsrCookieService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    const { i18n, userLang } = this.config;
    if (userLang) {
      this.translate.setDefaultLang(userLang);
      if (userLang == 'en')
        document.body.setAttribute('dir', 'ltr');
      else
        document.body.setAttribute('dir', 'rtl');

    } else if (i18n && i18n.defaultLanguage) {
      this.translate.setDefaultLang(i18n.defaultLanguage);
      if (i18n.defaultLanguage == 'en')
        document.body.setAttribute('dir', 'ltr');
      else
        document.body.setAttribute('dir', 'rtl');
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const navMain = document.getElementById('navbarCollapse');
      if (navMain) {
        navMain.onclick = function onClick() {
          if (navMain) {
            navMain.classList.remove('show');
          }
        };
      }

      if (this.currentUser && this.currentUser._id) {
        const cartInfo = this.cookieService.get('cartInfo');
        if (cartInfo) {
          this.cartService.updateCartInfoFromLocal(JSON.parse(cartInfo));
        }
      }
      const { colorScheme, siteFavicon } = this.config;

      (function ($) {
        if (siteFavicon) {
          $('#favicon').attr('href', siteFavicon);
        }
        if (colorScheme && colorScheme.btn_color) {
          $('head').append(`
          <style type="text/css">
             .nav-tabs .nav-link, .noti-link {
              color: ${colorScheme.btn_color};
              &:hover {
                color: ${colorScheme.btn_color}b3;
              }
            }
            .footer-link:hover {
                color: ${colorScheme.btn_color};
            }
            .btn.btn-default , .data-table .page-item.active .page-link, .btn.btn-footer, .btn.btn-light:hover, .wrapper-dashboard .left-sidebar .nav li a.active, .wrapper-dashboard .left-sidebar .nav li a:hover, .badge-default, .slot-btn {
              background-color: ${colorScheme.btn_color} !important;

              &:not(.no-hover)&:hover {
                background-color: ${colorScheme.btn_color}b3 !important;
              }
              &.no-hover&:hover {
                background-color: ${colorScheme.btn_color} !important;
              }
            }

            .bg-color-default {
              background-color: ${colorScheme.btn_color};
            }
            .header .nav-item .nav-link.active, .header .nav-item .nav-link:hover , .color-light-red , .wrapper-dashboard .left-sidebar .sidebar-nav-fixed .nav li:hover a, .wrapper-dashboard .sidebar-nav-fixed-mobile li:hover a, .wrapper-dashboard .left-sidebar .sidebar-nav-fixed .nav li.active a, {
              color: ${colorScheme.btn_color};
            }
            .pn-ProductNav_Link.active {
              color: ${colorScheme.btn_color};
            }
            .wrapper-dashboard .left-sidebar .main-sidebar .sidebar .pn-ProductNav_Link.active, .wrapper-dashboard .left-sidebar .main-sidebar .sidebar .pn-ProductNav_Link:hover, .morelink, .card-pagination.pagination li.active a,  .menu-item .img-card, .header .nav-item .nav-link.active, .header .nav-item .nav-link:hover  {
              color: ${colorScheme.btn_color} !important
            }
            input:checked + .slider, .custom-radio input:checked ~ .checkmark {
              background-color: ${colorScheme.btn_color};
            }
            .wrapper-dashboard .left-sidebar .sidebar-nav-fixed, .wrapper-dashboard .sidebar-nav-fixed-mobile, 
            .wrapper-dashboard .brand-link {
              border-bottom: 0.1rem solid ${colorScheme.btn_color};
            }
            .wizard li > a , .color-light-red {
              color: ${colorScheme.btn_color}
            }
            .wizard li.active, .wizard li:hover, .wizard .nav-tabs > li.active > a {
              background: ${colorScheme.btn_color};
              border-color: ${colorScheme.btn_color};
            }
            .wizard li:hover > a {
              color: #fff
            }
            .wizard .nav-tabs > li.active > a:hover, .wizard .nav-tabs > li.active > a:focus,  {
              background-color: ${colorScheme.btn_color};
            }
            .border-default-color, .border-solid {
              border-color: ${colorScheme.btn_color} !important;
            }
            .text-default-color, .color-primary, .hyperlink:hover {
              color: ${colorScheme.btn_color} !important;
            }
            .bg-secondary-default, .custom-radio .checkmark {
              background-color: ${colorScheme.btn_color}33;
            }
            .book_btnss_ a:hover {
              color:  ${colorScheme.btn_color};
            }
            .default-hover-color:hover {
              color:  ${colorScheme.btn_color} !important;
            }
            .nav-custom li.active a{
              color:  ${colorScheme.btn_color};
              border-color: ${colorScheme.btn_color};
            }
            .available-slot.active {
              background-color: ${colorScheme.btn_color} !important;
            }
            .slot-box{
              background-color: ${colorScheme.btn_color} !important; 
            }
          </style>`);
        }
        if (colorScheme && colorScheme.background_color) {
          $('head').append(`
              <style type="text/css">
                .bg-color-light, .profile-page::before {
                  background-color: ${colorScheme.background_color}
                }
                .wrapper-dashboard .left-sidebar .main-sidebar .sidebar .pn-ProductNav_Link.active, .wrapper-dashboard .left-sidebar .main-sidebar .sidebar .pn-ProductNav_Link:hover, .btn.btn-light, .preloader {
                  background-color: ${colorScheme.background_color} !important
                }
                .available-slot {
                  background-color: ${colorScheme.background_color} !important;
                }
              </style>`);
        }
      })(jQuery);
    }
  }
}
