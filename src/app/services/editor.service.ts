import {
  ElementRef,
  Injectable,
  Renderer2,
  RendererFactory2,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  openDelimiter = '[';
  closeDelimiter = ']';
  renderer: Renderer2;
  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  convertToHtml(value: string, acceptedPlaceholders: string[]): string {
    const p = this.renderer.createElement('p');
    const escapedOpenDelimiter = this.openDelimiter.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
    const escapedCloseDelimiter = this.closeDelimiter.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
    const regex = new RegExp(
      `(${escapedOpenDelimiter}.*?${escapedCloseDelimiter}|[^${escapedOpenDelimiter}${escapedCloseDelimiter}]+)`,
      'g'
    );
    const sentences = value.match(regex);
    if (sentences) {
      sentences.forEach(sentence => {
        if (
          sentence.includes(this.openDelimiter) &&
          sentence.includes(this.closeDelimiter)
        ) {
          const placeholder = sentence
            .replace(this.openDelimiter, '')
            .replace(this.closeDelimiter, '');
          if (acceptedPlaceholders.includes(placeholder)) {
            p.appendChild(this.createPlaceholderElement(placeholder));
          }
        } else p.appendChild(this.createTextElement(sentence));
      });
    }
    return p.outerHTML.toString();
  }

  createPlaceholderElement(placeholder: string): HTMLElement {
    const placeholderElement = this.renderer.createElement('span');
    placeholderElement.innerText = placeholder;
    placeholderElement.classList.add('placeholder');
    placeholderElement.setAttribute('contenteditable', 'false');
    placeholderElement.setAttribute('placeholder', 'false');
    return placeholderElement;
  }

  createTextElement(placeholder: string): HTMLElement {
    const textElement = this.renderer.createElement('text');
    textElement.innerText = placeholder;
    return textElement;
  }

  convertToText(element: ElementRef | undefined): string {
    if (element) {
      const cloneElement = element.nativeElement.cloneNode(true) as HTMLElement;
      this.formatElements([cloneElement]);
      return cloneElement.textContent ?? '';
    }
    return '';
  }

  formatElements(elements: HTMLElement[]) {
    elements.forEach(element => {
      if (element.hasChildNodes()) {
        const listElementsArray = Array.from(element.children) as HTMLElement[];
        this.formatElements(listElementsArray);
      }
      if (element.hasAttribute('placeholder')) {
        element.innerText =
          this.openDelimiter + element.innerText + this.closeDelimiter;
      }
    });
  }
}
