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
  /**
   * @description Implementing write value from control value accessor
   * **/
  writeValue(value: string) {
    this.html = this.domSanitizer.bypassSecurityTrustHtml(
      this.editorService.convertToHtml(value, this.placeholders())
    );
  }
  /**
   * @description Implementing register on change from control value accessor
   * **/
  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn;
  }
  /**
   * @description Implementing register on touched from control value accessor
   * **/
  registerOnTouched(fn: (value: string) => void) {
    this.onTouched = fn;
  }
  /**
   * @description Contenteditable input event handler
   * **/
  onInput() {
    this.editorService.handleInput(
      this.editable()?.nativeElement,
      this.placeholders()
    );
    this.updateSentence();
  }
  /**
   * @description Contenteditable keydown event handler
   * **/
  onKeydown(event: KeyboardEvent) {
    const key = event.which || event.keyCode;
    console.log(event);
    switch (key) {
      case 32:
        this.editorService.handleSpace();
        break;
      case 13 | 10:
        this.editorService.handleEnter();
        break;
      case 8:
        this.editorService.handleBackSpace();
        break;
      default:
        break;
    }
  }
  /**
   * @description Selection called on focus, keyup, mouseup events to save the selected range and be able to insert placeholders from outside
   * **/
  onSelection() {
    this.savedRange = this.editorService.getSelectionRange();
  }
  /**
   * @description Suggested placeholder handler, inserting into editor
   * **/
  onPlaceholder(placeholder: string) {
    if (this.savedRange) {
      this.editorService.insertPlaceholderAtCursor(
        this.savedRange,
        placeholder
      );
      this.updateSentence();
    } else
      this.editorService.insertPlaceholderAtBottom(
        this.editable()?.nativeElement,
        placeholder
      );
  }
  /**
   * @description Updating control value
   * **/
  private updateSentence() {
    this.onChange(this.editorService.convertToText(this.editable()));
  }
}
