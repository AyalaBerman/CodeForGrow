import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IStaticPage } from 'src/app/interface';
import { SeoService, StaticPageService } from 'src/app/services';
@Component({
  selector: 'app-static-page',
  templateUrl: './page.component.html'
})
export class StaticPageComponent implements OnInit {
  public page: IStaticPage;
  private alias: any;
  public submitted: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pageService: StaticPageService,
    private seoService: SeoService
  ) {
    this.route.params.subscribe((params) => {
      this.alias = params.alias;
      this.pageService.findOne(this.alias).then((resp) => {
        this.page = resp.data;
        this.seoService.setMetaTitle(this.page.title);
      });
    });
  }
  ngOnInit() {}
}
