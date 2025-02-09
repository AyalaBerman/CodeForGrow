import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginComponent } from './login/login.component';
import { AuthRoutingModule } from './auth.routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SignupComponent } from './register/signup.component';
import { TimezoneComponent } from 'src/app/components/uis/timezone.component';
import { FileUploadComponent } from 'src/app/components/media/file-upload/file-upload.component';
import { ForgotComponent } from './forgot/forgot.component';

@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    forwardRef(() => TimezoneComponent),
    forwardRef(() => FileUploadComponent)
  ],
  exports: [LoginComponent, SignupComponent],
  declarations: [LoginComponent, SignupComponent, ForgotComponent],
  providers: []
})
export class AuthModule { }
