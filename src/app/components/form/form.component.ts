import { Component, output } from '@angular/core';
import { SentenceComponent } from '../sentence/sentence.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [SentenceComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  onSubmit = output<string>();
  placeholders: string[] = [
    'Company Name',
    'Agent Name',
    'First Name',
    'Last Name',
  ];
}
