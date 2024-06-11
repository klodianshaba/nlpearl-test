import { Component } from '@angular/core';
import { SentenceComponent } from '../../components/sentence/sentence.component';
import { FormComponent } from '../../components/form/form.component';
import { WelcomeComponent } from '../../components/welcome/welcome.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [SentenceComponent, FormComponent, WelcomeComponent],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss',
})
export class TestComponent {}
