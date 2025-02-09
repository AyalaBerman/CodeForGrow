import { Router } from '@angular/router';
import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';

import { IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  FavoriteService,
  LanguageService
} from 'src/app/services';
@Component({
  selector: 'app-tutor-card',
  templateUrl: './tutor-card.html',
  styleUrls: ['style.scss']
})
export class TutorCardComponent implements OnInit {
  @Input() tutor: IUser;
  @Input() config: any;
  public isLoggedin: boolean;
  @Input() currentUser: IUser;
  @Input() isBorder: boolean;

  @Output() hover = new EventEmitter();
  constructor(
    private authService: AuthService,
    private tutorFavoriteService: FavoriteService,
    private appService: AppService,
    public languageService: LanguageService,
    public router: Router,
    private elementRef: ElementRef
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    this.hover.emit({ top: rect.top, tutor: this.tutor });
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.hover.emit({ top: null, tutor: null });
  }

  ngOnInit() {
    this.isLoggedin = this.authService.isLoggedin();
  }

  favorite() {
    if (!this.currentUser)
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      this.tutorFavoriteService
        .favorite(
          {
            tutorId: this.tutor._id,
            type: 'tutor'
          },
          'tutor'
        )
        .then(() => {
          this.tutor.isFavorite = true;
          this.appService.toastSuccess(
            'Added to your favorite tutor list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  unFavorite() {
    if (!this.currentUser)
      this.appService.toastError('Please loggin to use this feature!');
    else {
      this.tutorFavoriteService
        .unFavorite(this.tutor._id || '', 'tutor')
        .then(() => {
          this.tutor.isFavorite = false;
          this.appService.toastSuccess(
            'Removed from your favorite tutor list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  bookFree() {
    this.router.navigate(['/appointments', this.tutor.username], {
      queryParams: { isFree: true }
    });
  }
}
