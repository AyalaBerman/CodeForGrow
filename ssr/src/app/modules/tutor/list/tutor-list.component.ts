import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { ISubject, ITopic, IUser } from 'src/app/interface';
import {
  AppService,
  CalendarService,
  CountryService,
  GradeService,
  STATE,
  SeoService,
  StateService,
  SubjectService,
  TopicService
} from 'src/app/services';
import { TutorService } from 'src/app/services/tutor.service';
const time_format = 'HH:mm:ss';
declare let $: any;

@Component({
  selector: 'app-tutor-list',
  templateUrl: './tutor-list.component.html'
  // styleUrls: ['./tutor-list.component.scss'],
})
export class TutorListComponent implements OnInit {
  public page = 1;
  public pageSize = 12;
  public tutors: IUser[] = [];
  public subjects: ISubject[] = [];
  public total: any = 0;
  public sort: any = '';
  public sortType: any = '';
  public countries: any;
  public showMoreFilter = false;

  public searchFields: any = {
    subjectIds: '',
    grade: '',
    categoryIds: '',
    countryCode: '',
    topicIds: ''
  };
  public grades: any = [];
  public loading = false;
  public timeout: any;
  public categories: any = [];
  public dateChange: any = {};
  public topics: ITopic[] = [];

  public activeTutor: IUser | null;

  private _schedule$ = new Subject();
  public scheduleByTutor = [];
  public loadingSchedule = false;
  calendar: any = {};

  public valid_time = {
    morning: {
      start: moment('06:00:00', time_format),
      to: moment('12:00:00', time_format)
    },
    afternoon: {
      start: moment('12:00:00', time_format),
      to: moment('18:00:00', time_format)
    },
    evening: {
      start: moment('18:00:00', time_format),
      to: moment('24:00:00', time_format)
    },
    night: {
      start: moment('00:00:00', time_format),
      to: moment('06:00:00', time_format)
    }
  };
  public currentUser: IUser;
  public config: any;

  public isHoverTutor: boolean;

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    private tutorService: TutorService,
    private router: Router,
    private gradeService: GradeService,
    private countryService: CountryService,
    private subjectService: SubjectService,
    private topicService: TopicService,
    private translate: TranslateService,
    private calendarService: CalendarService,
    public stateService: StateService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('List Tutor');
    this.seoService.setMetaDescription(
      "If you're looking for someone to help make calculus sound sensical , you've come to the right place.Below you'll find some of our top calculus tutors."
    );
    const data = this.route.snapshot.data['search'];
    if (data) {
      this.tutors = data.items;
      this.total = data.count;
    }
    this.categories = this.route.snapshot.data['categories'];
    this.route.queryParams.subscribe((params: any) => {
      let filter = { ...params };
      if (params.category) {
    
        const category = this.categories.find(
          (item: any) => item.alias === params.category
        );
        filter = {
          categoryIds: category ? category._id : ''
        };
      }
      this.searchFields = { ...this.searchFields, ...filter };
      if (this.searchFields.categoryIds) this.querySubjects();
      this.page = params.page ? parseInt(params.page, 10) : 1;
      this.query();
    });
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  @HostListener('window:scroll', ['$event']) scrollHandler() {
    if (this.activeTutor && !this.isHoverTutor) {
      this.activeTutor = null;
    }
  }

  onHoverTutor({ top, tutor }: { top: number; tutor: IUser }) {
    this.isHoverTutor = !!tutor;
    if (tutor && (!this.activeTutor || tutor._id !== this.activeTutor?._id)) {
      this.activeTutor = tutor;
      $('.floatind_videobx').css({ top: `${top}px` });
      this.loadingSchedule = true;
      this.calendarService
        .all({
          tutorId: this.activeTutor._id,
          startTime: moment().startOf('week').toDate().toISOString(),
          toTime: moment().endOf('week').toDate().toISOString(),
          take: 10000,
          type: 'subject',
          sort: 'startTime',
          sortType: 'asc'
        })
        .then((resp: any) => {
          if (resp.data && resp.data.items) {
            this.scheduleByTutor = resp.data.items;
            this.mappingDataInTime(resp.data.items);
          }
          this.loadingSchedule = false;
        });
    }
  }

  ngOnInit(): void {
    this.countries = this.countryService.getCountry();
    this.gradeService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        this.grades = resp.data.items;
      });
  }

  showMore() {
    this.showMoreFilter = !this.showMoreFilter;
  }

  query() {
    if (!this.loading) {
      this.loading = true;
      console.log({
        page: this.page,
        take: this.pageSize,
        sort: this.sort,
        sortType: this.sortType,
        ...this.searchFields,
        ...this.dateChange
      });
      this.tutorService
        .search({
          page: this.page,
          take: this.pageSize,
          sort: this.sort,
          sortType: this.sortType,
          ...this.searchFields,
          ...this.dateChange
        })
        .then((resp) => {
          console.log("resp:: "+JSON.stringify(resp, null, 2));
          this.total = resp.data.count;
          this.tutors = resp.data.items;
          if (this.tutors.length) {
            this.activeTutor = this.tutors[0];
            this.loadingSchedule = true;
            this.calendarService
              .all({
                tutorId: this.activeTutor._id,
                startTime: moment().startOf('week').toDate().toISOString(),
                toTime: moment().endOf('week').toDate().toISOString(),
                take: 10000,
                type: 'subject',
                sort: 'startTime',
                sortType: 'asc'
              })
              .then((res: any) => {
                if (res.data && res.data.items) {
                  this.scheduleByTutor = res.data.items;
                  this.mappingDataInTime(res.data.items);
                  this.loadingSchedule = false;
                }
              });
          } else {
            this.activeTutor = null as any;
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
          this.appService.toastError(null);
        });
    }
  }

  apply() {
    this.showMore();
    this.query();
  }
  gradeChange() {
    this.page = 1;
    this.router.navigate(['/tutors'], {
      queryParams: {
        subjectId: this.searchFields.subjectId,
        grade: this.searchFields.grade,
        countryCode: this.searchFields.countryCode
      }
    });
    this.query();
  }
  subjectChange() {
    this.page = 1;
    // this.query();
    this.router.navigate(['/tutors'], {
      queryParams: {
        subjectId: this.searchFields.subjectId,
        grade: this.searchFields.grade,
        countryCode: this.searchFields.countryCode
      }
    });
    this.query();
  }

  dateChangeEvent(dateChange: any) {
    if (!dateChange) {
      if (this.dateChange.startTime && this.dateChange.toTime) {
        delete this.dateChange.startTime;
        delete this.dateChange.toTime;
        this.query();
      }
    } else {
      this.dateChange = {
        startTime: dateChange.from,
        toTime: dateChange.to
      };
      this.query();
    }
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.router.navigate([], {
      queryParams: { page: this.page },
      queryParamsHandling: 'merge'
    });
  }

  selectCategory() {
    if (this.searchFields.categoryIds) {
      this.querySubjects();
      this.searchFields.topicIds = [];
    } else {
      this.searchFields.subjectIds = [];
      this.searchFields.topicIds = [];
      this.subjects = [];
      this.topics = [];
    }
    this.query();
  }

  querySubjects() {
    this.subjectService
      .search({
        categoryIds: this.searchFields.categoryIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.subjects = resp.data.items;
        } else {
          this.subjects = [];
        }
      });
  }

  selectSubject() {
    if (this.searchFields.subjectIds) {
      this.queryTopic();
    } else {
      this.searchFields.topicIds = [];
      this.topics = [];
    }
    this.query();
  }

  queryTopic() {
    this.topicService
      .search({
        subjectIds: this.searchFields.subjectIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.topics = resp.data.items;
        } else {
          this.topics = [];
        }
      });
  }

  mappingDataInTime(items: any) {
    this.calendar = {
      Sunday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Monday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Tuesday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Wednesday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Thursday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Friday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Saturday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      }
    };
    if (items.length !== 0) {
      items.map((item: any) => {
        const item_day = moment(item.startTime).format('dddd');
        const item_time = moment(
          moment(item.startTime).format(time_format),
          time_format
        );

        if (
          item_time.isBetween(
            this.valid_time.morning.start,
            this.valid_time.morning.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['morning'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.afternoon.start,
            this.valid_time.afternoon.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['afternoon'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.evening.start,
            this.valid_time.evening.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['evening'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.night.start,
            this.valid_time.night.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['night'] = true;
        }
      });
    }
  }
}
