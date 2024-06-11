import {
  Component,
  ElementRef,
  forwardRef,
  input,
  Renderer2,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { PlaceholdersComponent } from '../placeholders/placeholders.component';

@Component({
  selector: 'app-sentence',
  standalone: true,
  imports: [PlaceholdersComponent],
  templateUrl: './sentence.component.html',
  styleUrl: './sentence.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SentenceComponent),
      multi: true,
    },
  ],
})
export class SentenceComponent {
  placeholders = input<string[]>([]);
  editable = viewChild<ElementRef>('editable');
  html: SafeHtml = '';
  onChange: (value: string) => void = () => {};
  constructor(
    private domSanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {}

  writeValue(value: string) {
    this.html = this.domSanitizer.bypassSecurityTrustHtml(value);
  }
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {}

  onInput(event: Event) {
    const text = this.editable()?.nativeElement.textContent;
    this.onChange(text);
    console.log(event);
  }
  onPlaceholder(placeholder: string) {
    console.log(placeholder);
    const k = '&#xFEFE;';
    const placeholderElement = this.renderer.createElement('span');
    placeholderElement.innerText = placeholder;
    placeholderElement.classList.add('placeholder');
    placeholderElement.setAttribute('contenteditable', false);

    this.renderer.appendChild(
      this.editable()?.nativeElement,
      placeholderElement
    );
  }
}
