import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkComponent } from './components/work/word.component';
import { TeachWithUsComponent } from './components/teach/teach.component';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { StaticPageComponent } from './components/static-page/page.component';

const routes: Routes = [
  {
    path: 'how-does-it-work',
    component: WorkComponent
  },
  {
    path: 'teach-with-us',
    component: TeachWithUsComponent,
    resolve: {}
  },
  {
    path: 'error/:code',
    component: PageErrorComponent
  },
  {
    path: ':alias',
    component: StaticPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
