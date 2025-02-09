import {
  Component,
  OnInit,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { NgSelectComponent } from '@ng-select/ng-select';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IMyCourse, IMySubject, ISubject, IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  CountryService,
  GradeService,
  LanguageService,
  MyCourseService,
  MySubjectService,
  STATE,
  SeoService,
  StateService,
  TutorService,
  UserService,
  UtilService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { IResponse } from 'src/app/services/api-request';
import { AvatarUploadComponent } from 'src/app/components/media/avatar-upload/avatar-upload.component';
import { MyCertificateComponent } from 'src/app/components/user/my-certificate-modal/my-certificate.component';
import { AddCetificationComponent } from 'src/app/components/tutor/certificate/add-certification/add-certification.component';
import { quillConfig } from 'src/app/lib';

type tplotOptions = {
  [key: string]: any;
};
@Component({
  selector: 'app-profile-update',
  templateUrl: './form.html'
})
export class ProfileUpdateComponent implements OnInit {
  @ViewChild('language') ngSelectComponent: NgSelectComponent;
  public info: IUser;
  public avatarUrl = '';
  public checkAvatar: boolean;
  public isSubmitted = false;
  public avatarOptions: any = {};
  private userId: string;
  public config: any;
  public uploading = false;

  @Output() afterCancel = new EventEmitter();
  public isEditProfile = false;
  public isEditDescription = false;
  public isEditGrade = false;
  public isEditSubject = false;

  public countries: any;
  public languages: any;
  public languageNames: any = [];
  public objectLanguage: any = {};

  public gradeNames: any = [];
  public grades: any;
  public totalUserGrades = 0;

  public subjects: ISubject[] = [];
  public tutorSubjects: IMySubject[] = [];

  public emailInvite = '';

  public timezone: any;
  public loading = false;
  public showChar = 500;
  public showMore = false;

  public webUrl: string;
  public myCompletedCourses: IMyCourse[] = [];

  public introVideoType = 'upload';
  public introVideoOptions: any;
  public introVideo: any;
  public introVideoName = '';

  public quillConfig = quillConfig;
  banner = 'url(assets/images/dashboard/bg-profile.svg)';
  active = 1;
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private tutorService: TutorService,
    private gradeService: GradeService,
    private languageService: LanguageService,
    private countryService: CountryService,
    private utilService: UtilService,
    private modalService: NgbModal,
    private mySubjectService: MySubjectService,
    private myCourseService: MyCourseService,
    private appService: AppService,
    private stateService: StateService
  ) {
    this.subjects = this.route.snapshot.data['subjects'];
    this.seoService.setMetaTitle('Profile');
    this.webUrl = environment.url;
  }

  async ngOnInit() {
    this.config = this.stateService.getState(STATE.CONFIG);
    if (this.config && this.config.profileBanner) {
      this.banner = `url(${this.config.profileBanner})`;
    }
    this.loading = true;
    this.countries = this.countryService.getCountry();
    this.languages = this.languageService.getLang();
    this.objectLanguage = this.languageService.languages;
    this.avatarOptions = {
      url: environment.apiBaseUrl + '/users/avatar',
      fileFieldName: 'avatar',
      onFinish: (resp: IResponse<any>) => {
        this.avatarUrl = resp.data.url;
      }
    };

    this.introVideoOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-introVideo',
      fileFieldName: 'file',
      onFinish: (resp: IResponse<any>) => {
        this.info.introVideoId = resp.data._id;
        this.introVideoName = resp.data.name;
        this.uploading = false;
      },

      onFileSelect: (resp: any) => (this.introVideo = resp[0].file),
      id: 'id-introVideo',
      accept: 'video/*',
      onUploading: () => (this.uploading = true)
    };

    await this.userService.me().then((resp: IResponse<any>) => {
      this.info = resp.data;
      if (this.info && this.info.bio && this.info.bio.length > this.showChar) {
        this.showMore = true;
      }

      if (this.info.type === 'tutor') {
        this.introVideoType = this.info.introVideoId ? 'upload' : 'youtube';
      }

      if (this.info.introVideo) {
        this.introVideoName = this.info.introVideo.name;
      }

      const params = {
        tutorId: this.info._id
      };
      this.mySubjectService.search(params).then((res: IResponse<any>) => {
        this.tutorSubjects = res.data.items;
      });
      this.userId = this.info._id;

      this.avatarUrl = resp.data.avatarUrl;
      if (this.avatarUrl !== 'http://localhost:9000/assets/default-avatar.jpg')
        this.checkAvatar = true;
    });

    await this.myCourseService
      .search({ isCompleted: true, sort: 'completedAt', sortType: 'desc' })
      .then((resp) => {
        this.myCompletedCourses = resp.data.items;
      });

    await this.gradeService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        this.grades = resp.data.items;
      });
    this.mapGradeName(this.info.grades);
    this.mapLanguageName(this.info.languages);
    this.loading = false;
  }

  mapGradeName(gradeKeys: any) {
    this.grades.forEach((key: any) => {
      if (gradeKeys.indexOf(key.id) > -1) {
        this.gradeNames.push(key.name);
      }
    });

    this.totalUserGrades = this.gradeNames.length;
    if (this.totalUserGrades > 4) this.gradeNames = _.chunk(this.gradeNames);
  }
  mapLanguageName(languageKeys: any) {
    languageKeys.forEach((key: string) => {
      this.languageNames.push(this.objectLanguage[key]);
    });
  }

  changeTimezone(event: any) {
    if (event === 'Asia/Saigon') {
      this.info.timezone = 'Asia/Ho_Chi_Minh';
    } else {
      this.info.timezone = event;
    }
  }

  submit(frm: any, isSubmitForm = true) {
    if (isSubmitForm) {
      this.isSubmitted = true;
      if (this.info.type === 'tutor') {
        if (!this.info.introVideoId && !this.info.introYoutubeId)
          return this.appService.toastError('Please upload introduction video');
      }

      if (this.introVideoType === 'youtube') {
        this.info.introVideoId = null;
      } else this.info.introYoutubeId = '';

      if (!frm.valid || !this.info.timezone) {
        return this.appService.toastError(
          'Form is invalid, please check again.'
        );
      }
      this.isEditProfile = false;
      this.isEditDescription = false;
    }

    if (this.info.type === 'tutor') {
      const data = _.pick(this.info, [
        'name',
        'username',
        'subjectIds',
        'bio',
        'email',
        'address',
        'phoneNumber',
        'grades',
        'languages',
        'password',
        'timezone',
        'gender',
        'zipCode',
        'price1On1Class',
        'idYoutube',
        'country',
        'city',
        'state',
        'introYoutubeId',
        'introVideoId',
        'defaultSlotDuration',
        'paypalEmailId'
      ]);

      return this.tutorService
        .update(data)
        .then((resp) => {
          console.log(resp);

          this.info = _.merge(resp.data, this.info);
          this.languageNames = [];
          this.mapLanguageName(this.info.languages);
          this.gradeNames = [];
          this.mapGradeName(this.info.grades);
          this.appService.toastSuccess('Updated successfully!');
          this.utilService.notifyEvent('profileUpdate', this.info);
          this.authService.updateCurrentUser(this.info);
          localStorage.setItem('timeZone', this.info.timezone);
          this.stateService.saveState(STATE.CURRENT_USER, this.info);
        })
        .catch((err: any) => this.appService.toastError(err));
    }

    return this.userService
      .updateMe(this.info)
      .then((resp: IResponse<any>) => {
        this.info = _.merge(resp.data, this.info);
        this.appService.toastSuccess('Updated successfully!');
        this.utilService.notifyEvent('profileUpdate', this.info);
        localStorage.setItem('timeZone', this.info.timezone);
        this.stateService.saveState(STATE.CURRENT_USER, this.info);
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  changeNotification() {
    this.info.notificationSettings = !this.info.notificationSettings;

    const data = _.pick(this.info, ['notificationSettings']);
    this.userService
      .updateMe(data)
      .then((resp: IResponse<any>) => {
        this.info = _.merge(resp.data, this.info);
        if (this.info.notificationSettings === true) {
          this.appService.toastSuccess('Notification activated successfully!');
        }
        if (this.info.notificationSettings === false) {
          this.appService.toastSuccess(
            'Notification deactivated successfully!'
          );
        }
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  inviteFriend() {
    this.userService
      .inviteFriend({ email: this.emailInvite })
      .then((resp: IResponse<any>) => {
        if (resp.data.success) {
          return this.appService.toastSuccess('Invited Successfully!');
        }
        return this.appService.toastError('Invite fail');
      });
  }

  onChangeLanguage(e: any) {
    this.ngSelectComponent.clearAllText = '';
  }

  onChangeGrade(event: any) {
    this.info.grades = [];
    event.forEach((element: any) => {
      this.info.grades.push(element.id);
    });
    this.submit('', false);
  }

  openChangeAvatarModal() {
    const modalRef = this.modalService.open(AvatarUploadComponent, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.info = this.info;
    modalRef.result.then((res) => {
      this.afterCancel.emit(res);
      this.info.avatarUrl = res;
      this.checkAvatar = true;
    });
  }

  openCertification(type: string, index = 0, certificate = null as any) {
    const modalRef = this.modalService.open(AddCetificationComponent, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.tutorId = this.info._id;
    modalRef.componentInstance.certificate = certificate;
    modalRef.componentInstance.type = type || 'education';
    modalRef.result.then((res) => {
      const plotOptions: tplotOptions = this.info;
      if (certificate) {
        plotOptions[type][index] = res;
      } else {
        plotOptions[type].push(res);
      }
      this.info = plotOptions as IUser;
    });
  }

  deleteCer(type: string, index: number, certificate: any = null) {
    if (
      window.confirm('Are you sure to delete this certificate?') &&
      certificate
    ) {
      this.tutorService
        .deleteCertificate(certificate._id)
        .then(() => {
          this.appService.toastSuccess('Deleted certificate successfully');
        })
        .catch((err: any) => {
          this.appService.toastError(err);
        });
    }
  }

  deleteAvatar() {
    if (this.checkAvatar) {
      if (window.confirm('Are you sure to delete your avatar?')) {
        this.userService
          .deleteAvatar()
          .then(() => {
            this.info.avatarUrl =
              'http://localhost:9000/assets/default-avatar.jpg';
            this.appService.toastSuccess('Delete avatar successfully');
            this.checkAvatar = false;
          })
          .catch((err: any) => {
            this.appService.toastError(err);
          });
      }
    } else {
      this.appService.toastError('No avatar to delete!');
    }
  }

  viewCertificate(myCourse: any) {
    const modalRef = this.modalService.open(MyCertificateComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl'
    });
    modalRef.componentInstance.myCourse = myCourse;
    modalRef.componentInstance.userName = this.info.name;
    modalRef.componentInstance.appConfig = this.config;
  }

  submitChangeEmail() {
    if (
      window.confirm(
        `Are you sure to change your email to ${this.info.email}? We will send you an email to verify your new email, please verify it to continue using the site.`
      )
    )
      this.userService
        .changeEmail(this.info._id, { email: this.info.email })
        .then(() => {
          this.appService.toastSuccess(
            'An email has been sent to your new email address, please verify it.'
          );
          this.authService.removeToken();
          window.location.href = '/';
        })
        .catch((err: any) => {
          this.appService.toastError(err);
        });
  }
}
