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
  editable = viewChild<ElementRef<HTMLElement>>('editable');
  html: SafeHtml = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: (value: string) => void = () => {};
  private savedRange: Range | undefined;

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

  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: (value: string) => void) {
    this.onTouched = fn;
  }

  onInput() {
    this.editorService.handleInput(
      this.editable()?.nativeElement,
      this.placeholders()
    );
    this.updateSentence();
  }

  onKeydown(event: KeyboardEvent) {
    console.log(event);
    switch (event.code) {
      case 'Space':
        this.editorService.handleSpace();
        break;
      case 'Enter':
        this.editorService.handleEnter();
        break;
      default:
        break;
    }
  }

  onSelection() {
    this.savedRange = this.editorService.getSelectionRange();
  }

  onPlaceholder(placeholder: string) {
    if (this.savedRange) {
      this.editorService.insertAtCursor(this.savedRange, placeholder);
      this.updateSentence();
    } else
      this.editorService.insertAtBottom(
        this.editable()?.nativeElement,
        placeholder
      );
  }

  private updateSentence() {
    this.onChange(this.editorService.convertToText(this.editable()));
  }
}
