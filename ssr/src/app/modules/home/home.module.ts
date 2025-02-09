import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { SearchBarComponent } from 'src/app/components/home/search-bar/search-bar.component';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CardCourseComponent } from 'src/app/components/course/card-course/card-course.component';
import { CardWebinarComponent } from 'src/app/components/webinar/card-webinar/card-webinar.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { SharedModule } from 'src/app/shared.module';
@NgModule({
  declarations: [HomeComponent, SearchBarComponent],
  imports: [
    CommonModule,
    NgbTypeaheadModule,
    TranslateModule.forChild(),
    RouterModule,
    CardCourseComponent,
    CardWebinarComponent,
    SlickCarouselModule,
    SharedModule
  ],
  exports: [SearchBarComponent]
})
export class HomeModule { }
