import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PageRoutingModule } from './page.routing';
import { WorkComponent } from './components/work/word.component';
import { TeachWithUsComponent } from './components/teach/teach.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import { StaticPageService } from 'src/app/services';
import { StaticPageComponent } from './components/static-page/page.component';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    PageRoutingModule,
    SlickCarouselModule,
    TranslateModule.forChild(),
    forwardRef(() => SharedModule)
  ],
  declarations: [
    WorkComponent,
    TeachWithUsComponent,
    PageErrorComponent,
    StaticPageComponent
  ],
  exports: [],
  entryComponents: [],
  providers: [StaticPageService]
})
export class PageModule {}
