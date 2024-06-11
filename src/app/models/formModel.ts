import { FormControl } from '@angular/forms';

export interface FormModel {
  name: FormControl<string | null>;
  phone: FormControl<string | null>;
  sentence: FormControl<string | null>;
}
