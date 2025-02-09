import { Component, OnInit, EventEmitter, Input, Output, AfterViewInit } from '@angular/core';
import { FileUploader, FileItem, FileLikeObject, FileUploadModule } from 'ng2-file-upload';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppService, AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  templateUrl: './upload.html',
  standalone: true,
  imports: [CommonModule, FileUploadModule, TranslateModule, FormsModule]
})
export class FileUploadComponent implements OnInit, AfterViewInit {
  /**
   * option format
   * {
   *  customFields: { key: value } // additional field will be added to the form
   *  query: { key: value } // custom query string
   * }
   */
  @Input() options: any;
  @Output() finishUpload = new EventEmitter();
  public hasBaseDropZoneOver: Boolean = false;
  public uploader: FileUploader;
  public multiple: Boolean = false;
  public uploadOnSelect: Boolean = false;
  public autoUpload: Boolean = false;
  public progress: any = 0;
  private uploadedItems: any = [];
  public totalLength: number;

  constructor(
    private authService: AuthService,
    private toasty: ToastrService,
    private translate: TranslateService,
    private appService: AppService
  ) { }

  ngOnInit() {
    // TODO - upload default file url and custom field here
    this.multiple = this.options && this.options.multiple;
    this.uploadOnSelect = this.options && this.options.uploadOnSelect;
    this.autoUpload = this.options && this.options.autoUpload;
    if (!this.options) {
      this.options = {};
    }

    // https://github.com/valor-software/ng2-file-upload/blob/development/src/file-upload/file-uploader.class.ts
    this.uploader = new FileUploader({
      url: environment.apiBaseUrl + '/media',
      authToken: 'Bearer ' + this.authService.getAccessToken(),
      autoUpload: this.options.autoUpload || false,
      maxFileSize: environment.maximumFileSize * 1024 * 1024
    });

    this.uploader.onBuildItemForm = (fileItem: FileItem, form: any) => {
      fileItem.alias = this.options.fileFieldName || 'file';
      // append the form
      if (this.options.customFields) {
        Object.keys(this.options.customFields).forEach(key => form.append(key, this.options.customFields[key]));
      }
      const { file } = fileItem;
      if (this.options.url) {
        fileItem.url = this.options.url;
      } else {
        let ep = 'files';
        const type = file.type as string;
        if (type.indexOf('image') > -1) {
          ep = 'photos';
        } else if (type.indexOf('video') > -1) {
          ep = 'videos';
        }

        fileItem.url = `${environment.apiBaseUrl}/media/${ep}`;
      }
    };

    this.uploader.onProgressItem = (fileItem: FileItem, progress: any) => (fileItem.progress = progress);

    this.uploader.onProgressAll = (progress: any) => {
      this.progress = progress;
    };

    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      this.uploader.removeFromQueue(item);

      // TODO - handle error event too
      const resp = JSON.parse(response);
      this.uploadedItems.push(resp);
      if (this.options.onCompleteItem) {
        this.options.onCompleteItem(resp);
      }
    };
    this.options.uploader = this.uploader;
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngAfterViewInit() {
    this.uploader.onAfterAddingFile = item => (item.withCredentials = false);
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  fileSelect(event: any) {
    if (!this.multiple) {
      this.uploader.clearQueue();
      const file: File = event[0];
      const fileLikeObject: FileLikeObject = event[0];

      if (!this.uploader._fileSizeFilter(fileLikeObject)) {
        return this.toasty.error(this.translate.instant('File size is larger than maximum size!'));
      }
      if (this.options.accept) {
        const accept = this.accept(file.type, this.options.accept);
        if (!accept) {
          return this.toasty.error(this.translate.instant('Invalid file type'));
        }
      }
      this.uploader.addToQueue([file]);
    }
    if (this.options.onFileSelect) {
      this.options.onFileSelect(this.uploader.queue);
    }
    if (this.options.uploadOnSelect) {
      this.uploader.uploadAll();
    }

    return true;
  }

  fileDrop(event: any) {
    if (!this.multiple) {
      this.uploader.clearQueue();
      const file: File = event[0];
      const fileLikeObject: FileLikeObject = event[0];

      if (!this.uploader._fileSizeFilter(fileLikeObject)) {
        return this.toasty.error(this.translate.instant('File size is larger than maximum size!'));
      }
      if (this.options.accept) {
        const accept = this.accept(file.type, this.options.accept);
        if (!accept) {
          return this.toasty.error(this.translate.instant('Invalid file type'));
        }
      }
      this.uploader.addToQueue([file]);
    }
    if (this.options.onFileSelect) {
      this.options.onFileSelect(this.uploader.queue);
    }
    if (this.options.uploadOnSelect) {
      this.uploader.uploadAll();
    }

    return true;
  }

  accept(fileType: string, accept: any) {
    const typeRegex = new RegExp(accept.replace(/\*/g, '.*').replace(/\,/g, '|'));
    return typeRegex.test(fileType);
  }

  upload() {
    if (!this.uploader.queue.length) {
      return alert(this.translate.instant('Please select file'));
    }
    if (this.options?.lecturePdf && (!this.totalLength || this.totalLength <= 0)) {
      return alert(this.translate.instant('Total length must be greater than 0!'));
    } else this.finishUpload.emit(this.totalLength);
    if (this.options.onUploading) {
      this.options.onUploading(true);
    }
    this.uploader.onCompleteAll = () => {
      // TODO - do something
      this.uploader.clearQueue();
      if (this.options.onFinish) {
        this.options.onFinish(this.options.multiple ? this.uploadedItems : this.uploadedItems[0]);
      }

      // reset because Queue reset too
      this.uploadedItems = [];
      this.progress = 0;
    };

    this.uploader.uploadAll();
  }
}
