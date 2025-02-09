import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule } from 'ng2-file-upload';
import { environment } from 'src/environments/environment';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-upload-avatar',
  templateUrl: './avatar-upload.modal.html',
  standalone: true,
  imports: [CommonModule, FileUploadModule, TranslateModule, FileUploadComponent]
})
export class AvatarUploadComponent implements OnInit {
  @Input() info: any;
  public maxFileSize: number;
  public avatarOptions: any = {};
  public avatarUrl: any = '';
  public imageSelected: any[] = [];
  constructor(public activeModal: NgbActiveModal) {
    this.maxFileSize = environment.maximumFileSize;
  }

  ngOnInit() {
    this.avatarOptions = {
      url: environment.apiBaseUrl + '/users/avatar',
      fileFieldName: 'avatar',
      onFinish: (resp: any) => {
        this.avatarUrl = resp.data.url;
        this.activeModal.close(this.avatarUrl);
      },
      onFileSelect: (resp: any) => (this.imageSelected = resp),
      accept: 'image/*'
    };
  }
}

@Component({
  selector: 'app-ngbd-modal-component',
  template: '<button class="btn btn-sm btn-outline-primary" (click)="open()">cancel</button>'
})
export class NgbdModalComponent {
  constructor(private modalService: NgbModal) { }
  @Input() appoinment: any = {};
  @Output() afterCancel = new EventEmitter();

  open() {
    const modalRef = this.modalService.open(AvatarUploadComponent, { centered: true, backdrop: 'static' });
    modalRef.componentInstance.info = this.appoinment;
    modalRef.result.then(
      res => {
        this.afterCancel.emit(res);
      }
    );
  }
}
