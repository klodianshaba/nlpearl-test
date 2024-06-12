import {
  Component,
  ElementRef,
  forwardRef,
  input,
  Renderer2,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PlaceholdersComponent } from '../placeholders/placeholders.component';
import { EditorService } from '../../services/editor.service';

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
export class SentenceComponent implements ControlValueAccessor {
  placeholders = input<string[]>([]);
  editable = viewChild<ElementRef>('editable');
  html: SafeHtml = '';
  private onChange: (value: string) => void = () => {};
  private savedRange: Range | null = null;

  constructor(
    private domSanitizer: DomSanitizer,
    private renderer: Renderer2,
    private editorService: EditorService
  ) {
    this.editorService.renderer = this.renderer;
  }

  writeValue(value: string) {
    this.html = this.domSanitizer.bypassSecurityTrustHtml(
      this.editorService.convertToHtml(value, this.placeholders())
    );
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {}

  onInput(event: Event) {
    this.updateSentence();
  }

  onPlaceholder(placeholder: string) {
    this.editorService.insertAtCursor(this.savedRange, placeholder);
    this.updateSentence();
  }

  saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedRange = selection.getRangeAt(0);
    }
  }

  private updateSentence() {
    const formatedText = this.editorService.convertToText(this.editable());
    this.onChange(formatedText);
  }
}
