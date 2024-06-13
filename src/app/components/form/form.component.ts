import { Component, output } from '@angular/core';
import { SentenceComponent } from '../sentence/sentence.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormGroupModel } from '../../models/form-group-model';
import { FormDataModel } from '../../models/form-data-model';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [SentenceComponent, ReactiveFormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  onSubmitted = output<FormDataModel>();
  formGroup: FormGroup<FormGroupModel>;
  placeholders: string[] = [
    'Company Name',
    'Agent Name',
    'First Name',
    'Last Name',
  ];
  initialFormData: FormDataModel = {
    name: 'Klodian Shaba',
    phone: '+355683834233',
    sentence:
      "Hi, this is [Agent Name], I'm calling from [Company Name] , do you have a few minutes for to answer some questions?",
  };

  constructor(private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group<FormGroupModel>({
      name: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      sentence: new FormControl('', Validators.required),
    });
    this.formGroup.patchValue(this.initialFormData);
  }
  /**
   * @description Submitting form button handler
   * **/
  onSubmit() {
    const formData: FormDataModel = {
      name: this.formGroup.value.name ?? null,
      phone: this.formGroup.value.phone ?? null,
      sentence: this.formGroup.value.sentence ?? null,
    };
    this.onSubmitted.emit(formData);
  }
}
