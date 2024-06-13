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
  zeroWidthNonBreakingSpace = '\uFEFF';
  renderer: Renderer2;
  placeholders: string[] = [];

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  handleInput(
    editableElement: HTMLElement | undefined,
    placeholders: string[]
  ) {
    this.placeholders = placeholders;
    this.checkContainer(editableElement);
    if (this.isPlaceholderElement()) this.handlePlaceholder();
    else if (this.isTextElement()) this.handleText();
  }

  handleSpace() {
    const element = this.isPlaceholderElement();
    if (element) {
      // placeholder element
      const cursorIndex = this.getCursorIndex(element);
      if (cursorIndex == element.innerText.trim().length) {
        // last character of placeholder
        const textElement = this.createTextElement(
          this.zeroWidthNonBreakingSpace + ' '
        );
        element.after(textElement);
        this.setCursorAt(textElement, 1);
      }
    }
  }

  handleEnter() {
    const element = this.isPlaceholderElement();
    if (element) {
      const cursorIndex = this.getCursorIndex(element);
      if (cursorIndex == 0) {
        // first character of placeholder
        const textElement = this.createTextElement(
          this.zeroWidthNonBreakingSpace + ' '
        );
        element.before(textElement);
        this.setCursorAt(textElement, 1);
      }
    }
  }

  isPlaceholderElement() {
    let result: HTMLElement | undefined;
    const element = this.getSelectionRangeElement();
    if (element) {
      if (element.nodeType == Node.ELEMENT_NODE) {
        if (element?.hasAttribute('placeholder')) result = element;
      }
    }
    return result;
  }

  isTextElement() {
    let result: HTMLElement | undefined;
    const element = this.getSelectionRangeElement();
    if (element) {
      if (element.nodeType == Node.TEXT_NODE) result = element;
    }
    return result;
  }

  canInsertPlaceholder(savedRange: Range) {
    const container = savedRange.startContainer;
    const element = this.getInputElement(container);
    if (element.nodeType == Node.ELEMENT_NODE) {
      return !element.hasAttribute('placeholder');
    }
    return true;
  }

  convertToHtml(value: string, acceptedPlaceholders: string[]): string {
    const p = this.renderer.createElement('p');
    const parts = this.splitPlaceholders(value);
    if (parts) {
      parts.forEach(part => {
        if (
          part.includes(this.openDelimiter) &&
          part.includes(this.closeDelimiter)
        ) {
          const placeholder = part
            .replace(this.openDelimiter, '')
            .replace(this.closeDelimiter, '');
          if (acceptedPlaceholders.includes(placeholder)) {
            p.appendChild(this.createPlaceholderElement(placeholder));
          }
        } else p.appendChild(this.createTextElement(part));
      });
    }
    return p.outerHTML.toString();
  }

  convertToText(element: ElementRef | undefined): string {
    if (element) {
      const cloneElement = element.nativeElement.cloneNode(true) as HTMLElement;
      this.formatElements([cloneElement]);
      return cloneElement.textContent ?? '';
    }
    return '';
  }

  createPlaceholderElement(placeholder: string): HTMLElement {
    const placeholderElement = this.renderer.createElement('span');
    placeholderElement.innerText = placeholder;
    placeholderElement.classList.add('placeholder');
    placeholderElement.setAttribute('contenteditable', 'true');
    placeholderElement.setAttribute('placeholder', 'true');
    return placeholderElement;
  }

  createTextElement(text: string): Text {
    return document.createTextNode(text);
  }

  insertAtCursor(savedRange: Range | undefined, placeholder: string) {
    const selection = window.getSelection();
    if (savedRange && selection) {
      if (this.canInsertPlaceholder(savedRange)) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
        const range = savedRange;
        const placeholderElement = this.createPlaceholderElement(placeholder);
        range.insertNode(placeholderElement);
        range.setStartAfter(placeholderElement);
        range.setEndAfter(placeholderElement);
        savedRange = range;
        selection.removeAllRanges();
        selection.addRange(range);
        this.setCursorAt(
          placeholderElement.firstChild,
          placeholderElement.innerText.length
        );
      }
    }
  }

  insertAtBottom(
    editableElement: HTMLElement | undefined,
    placeholder: string
  ) {
    const element = editableElement?.lastChild?.lastChild;
    if (element) {
      const placeholderElement = this.createPlaceholderElement(placeholder);
      element.after(placeholderElement);
      this.setCursorAt(
        placeholderElement.firstChild,
        placeholderElement.innerText.length
      );
    }
  }

  setCursorAt(child: Node | null, index: number) {
    const selection = window.getSelection();
    const range = document.createRange();
    if (selection && child) {
      range.setStart(child, index);
      range.setEnd(child, index);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  getCursorIndex(child: Node | null) {
    const selection = document.getSelection();
    if (!selection || !child) return 0;
    selection.collapseToEnd();
    const range = selection.getRangeAt(0);
    const clone = range.cloneRange();
    clone.selectNodeContents(child);
    clone.setEnd(range.startContainer, range.startOffset);
    return clone.toString().length;
  }

  getSelectionRange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return undefined;
  }

  getSelectionRangeElement() {
    let element: HTMLElement | undefined;
    const range = this.getSelectionRange();
    if (range) {
      const container = range.startContainer;
      element = this.getInputElement(container);
    }
    return element;
  }

  private getInputElement(container: Node) {
    return (
      container.parentElement instanceof HTMLParagraphElement
        ? container
        : container.parentElement
    ) as HTMLElement;
  }

  private handlePlaceholder() {
    const element = this.getSelectionRangeElement();
    if (element) {
      const text = element.textContent ?? '';
      const placeholder = this.getMatchingPlaceholder(text);

      if (!placeholder) {
        const parentElement = element.parentElement ?? element;
        const leftSiblingElement = this.getLeftSiblingElement(element);
        const rightSiblingElement = this.getRightSiblingElement(element);
        const cursorIndex = this.getCursorIndex(element);
        if (
          leftSiblingElement &&
          leftSiblingElement?.nodeType === Node.TEXT_NODE
        ) {
          const textCount = leftSiblingElement.textContent?.length ?? 0;
          leftSiblingElement.textContent += ' ' + element.innerText;
          this.setCursorAt(leftSiblingElement, textCount + cursorIndex + 1);
        } else if (
          rightSiblingElement &&
          leftSiblingElement?.nodeType === Node.TEXT_NODE
        ) {
          rightSiblingElement.textContent =
            element.innerText + ' ' + rightSiblingElement.textContent;
          this.setCursorAt(rightSiblingElement, cursorIndex + 1);
        } else {
          const textElement = this.createTextElement(element.innerText);
          parentElement.insertBefore(textElement, element);
          this.setCursorAt(textElement, cursorIndex);
        }
        parentElement.removeChild(element);
      }
    }
  }

  private handleText() {
    const element = this.getSelectionRangeElement();
    if (element) {
      const text = element.textContent ?? '';
      const placeholder = this.getIncludedPlaceholder(text);
      if (placeholder) {
        // placeholder included
        const parentElement = element.parentElement ?? element;
        const parts = this.splitPlaceholder(text, placeholder);
        parts?.forEach(part => {
          if (part.includes(placeholder)) {
            // placeholder
            const placeholderElement = this.createPlaceholderElement(part);
            parentElement.insertBefore(placeholderElement, element);
            this.setCursorAt(
              placeholderElement.firstChild,
              placeholderElement.innerText.length
            );
          } else {
            // text
            const textElement = this.createTextElement(part);
            parentElement.insertBefore(textElement, element);
          }
        });
        parentElement.removeChild(element);
      }
    }
  }

  private checkContainer(element: HTMLElement | undefined) {
    const container = this.getSelectionRange()?.startContainer;
    if (element && container) {
      if (element.textContent?.trim().length == 0) {
        while (container.firstChild) {
          container.firstChild.remove();
        }
        container.appendChild(
          document.createTextNode(this.zeroWidthNonBreakingSpace)
        );
      }
    }
  }

  private formatElements(elements: HTMLElement[]) {
    elements.forEach(element => {
      if (element.hasChildNodes()) {
        const listElementsArray = Array.from(element.children) as HTMLElement[];
        this.formatElements(listElementsArray); // recursive formating
      }
      if (element.hasAttribute('placeholder')) {
        element.innerText =
          this.openDelimiter + element.innerText + this.closeDelimiter;
      }
    });
  }

  private splitPlaceholder(text: string, placeholder: string) {
    const escapedSeparator = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.split(new RegExp(`(${escapedSeparator})`, 'g'));
  }

  private splitPlaceholders(text: string) {
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
    return text.match(regex);
  }

  private getLeftSiblingElement(element: HTMLElement) {
    const parentElement = element.parentElement ?? element;
    return parentElement.childNodes.item(
      Array.from(parentElement.childNodes).indexOf(element) - 1
    );
  }

  private getRightSiblingElement(element: HTMLElement) {
    const parentElement = element.parentElement ?? element;
    return parentElement.childNodes.item(
      Array.from(parentElement.childNodes).indexOf(element) + 1
    );
  }

  private getIncludedPlaceholder(text: string): string | undefined {
    return this.placeholders.find(placeholder => text.includes(placeholder));
  }

  private getMatchingPlaceholder(text: string): string | undefined {
    return this.placeholders.find(placeholder => text === placeholder);
  }
}
