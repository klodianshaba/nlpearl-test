import { FormControl } from '@angular/forms';

export interface FormGroupModel {
  name: FormControl<string | null>;
  phone: FormControl<string | null>;
  sentence: FormControl<string | null>;
}
