import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  SeoService,
  AppService,
  StateService,
  STATE
} from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  templateUrl: 'signup.component.html'
})
export class SignupComponent implements AfterViewInit {
  public account: any = {
    email: '',
    password: '',
    name: '',
    type: '',
    timezone: ''
  };
  public accountTutor: any = {
    email: '',
    password: '',
    name: '',
    issueDocument: '',
    resumeDocument: '',
    certificationDocument: '',
    timezone: '',
    introVideoId: '',
    introYoutubeId: ''
  };
  public introVideoType = 'upload';
  public confirm: any = {
    pw: ''
  };
  public maxFileSize: number;
  public isPasswordMatched = false;
  public submitted = false;
  public idDocumentOptions: any = {};
  public resumeOptions: any = {};
  public certificationOptions: any = {};
  public introVideoOptions: any = {};
  public idDocumentFile: any;
  public resumeFile: any;
  public certificationFile: any;
  public introVideo: any;
  public appConfig: any;
  public loading = false;
  public isAgreeWithTerms = true;

  constructor(
    private auth: AuthService,
    public router: Router,
    private seoService: SeoService,
    private appService: AppService,
    public stateService: StateService
  ) {
    this.maxFileSize = environment.maximumFileSize;
    this.appConfig = this.stateService.getState(STATE.CONFIG);
    if (this.appConfig) {
      const title = this.appConfig.siteName + ' - Sign Up';
      this.seoService.setMetaTitle(title);
    }

    this.introVideoOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-introVideo',
      onCompleteItem: (resp: any) => {
        this.accountTutor.introVideoId = resp.data._id;
        this.loading = false;
      },
      onFileSelect: (resp: any) => {
        const lastIndex = resp.length - 1;
        const file = resp[lastIndex].file;
        const ext = file.name.split('.').pop().toLowerCase();
        if (['mp4', 'webm', '3gp', 'ogg', 'wmv', 'webm'].indexOf(ext) === -1) {
          this.introVideoOptions.uploader.clearQueue();
          return this.appService.toastError('Invalid file type');
        }
        this.introVideo = file;
      },
      uploadOnSelect: true,
      id: 'id-introVideo',
      onUploading: () => (this.loading = true)
    };

    this.idDocumentOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-document',
      onCompleteItem: (resp: any) => {
        this.accountTutor.issueDocument = resp.data._id;
        this.loading = false;
      },
      onFileSelect: (resp: any) => {
        const lastIndex = resp.length - 1;
        const file = resp[lastIndex].file;
        const ext = file.name.split('.').pop().toLowerCase();
        if (
          ['pdf', 'doc', 'docx', 'zip', 'rar', 'jpg', 'jpeg', 'png'].indexOf(
            ext
          ) === -1
        ) {
          this.idDocumentOptions.uploader.clearQueue();
          return this.appService.toastError('Invalid file type');
        }
        this.idDocumentFile = file;
      },
      uploadOnSelect: true,
      id: 'id-document',
      onUploading: () => (this.loading = true)
    };
    this.resumeOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-document',
      onCompleteItem: (resp: any) => {
        this.accountTutor.resumeDocument = resp.data._id;
        this.loading = false;
      },
      onFileSelect: (resp: any) => {
        const lastIndex = resp.length - 1;
        const file = resp[lastIndex].file;
        const ext = file.name.split('.').pop().toLowerCase();
        if (['pdf'].indexOf(ext) === -1) {
          this.resumeOptions.uploader.clearQueue();
          return this.appService.toastError('Invalid file type');
        }
        this.resumeFile = file;
      },
      uploadOnSelect: true,
      id: 'id-resume',
      onUploading: () => (this.loading = true)
    };
    this.certificationOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-document',
      onCompleteItem: (resp: any) => {
        this.accountTutor.certificationDocument = resp.data._id;
        this.loading = false;
      },
      onFileSelect: (resp: any) => {
        const lastIndex = resp.length - 1;
        const file = resp[lastIndex].file;
        const ext = file.name.split('.').pop().toLowerCase();
        if (['pdf'].indexOf(ext) === -1) {
          this.certificationOptions.uploader.clearQueue();
          return this.appService.toastError('Invalid file type');
        }
        this.certificationFile = file;
      },
      uploadOnSelect: true,
      id: 'id-verification',
      onUploading: () => (this.loading = true)
    };
  }

  public onlyNumberKey(event: any) {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  public async submit(frm: any) {
    this.submitted = true;
    if (frm.invalid) {
      return;
    }
    if (!this.account.timezone) {
      return this.appService.toastError('Please select timezone');
    }
    if (this.account.password !== this.confirm.pw) {
      this.isPasswordMatched = true;
      return this.appService.toastError(
        'Confirm password and password dont match'
      );
    }
    if (this.account.type === '') {
      return this.appService.toastError('Please select type');
    }

    this.account.email = this.account.email.toLowerCase();

    if (this.account.type === 'tutor') {
      this.accountTutor.name = this.account.name;
      this.accountTutor.email = this.account.email;
      this.accountTutor.password = this.account.password;
      this.accountTutor.timezone = this.account.timezone;

      if (this.introVideoType == 'upload' && !this.accountTutor.introVideoId) {
        return this.appService.toastError('Please upload introduction video');
      }
      if (this.introVideoType === 'youtube') {
        this.accountTutor.introVideoId = null;
      }

      if (
        !this.accountTutor.issueDocument ||
        !this.accountTutor.resumeDocument ||
        !this.accountTutor.certificationDocument
      ) {
        return this.appService.toastError('Please upload all documents');
      }
      return this.auth
        .registerTutor(this.accountTutor)
        .then(() => {
          this.appService.toastSuccess(
            'Your account has been created, please verify your email then login'
          );
          this.router.navigate(['/auth/login']);
        })
        .catch((err) => {
          this.appService.toastError(err);
        });
    }
    this.auth
      .register(this.account)
      .then(() => {
        this.appService.toastSuccess(
          'Your account has been created, please verify your email then login'
        );
        this.router.navigate(['/auth/login']);
      })
      .catch((err) => {
        console.log(err);

        this.appService.toastError(err);
      });
  }

  changeTimezone(event: any) {
    if (event === 'Asia/Saigon') {
      this.account.timezone = 'Asia/Ho_Chi_Minh';
    } else {
      this.account.timezone = event;
    }
  }

  changeUploadType(event: any) {
    if (event.target.value === 'youtube') {
      this.accountTutor.introYoutubeId = 'ZU0gjnRU-Z4';
    } else {
      this.accountTutor.introYoutubeId = '';
    }
  }

  ngAfterViewInit() {
    const target = document.getElementById('email-input') as any;
    target.addEventListener(
      'paste',
      (event: any) => {
        event.preventDefault();
        const clipboard = event.clipboardData,
          text = clipboard.getData('Text');
        event.target.value = text.trim();
        this.account.email = text.trim();
      },
      false
    );
  }
}
