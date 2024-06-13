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
  zeroWidthSpace = '\u200B';
  renderer: Renderer2;
  placeholders: string[] = [];

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }
  /**
   * @description Input handler, checking for placeholder possibilities
   * **/
  handleInput(
    editableElement: HTMLElement | undefined,
    placeholders: string[]
  ) {
    this.placeholders = placeholders;
    this.checkContainer(editableElement);
    if (this.isPlaceholderElement()) this.handlePlaceholder();
    else if (this.isTextElement()) this.handleText();
  }
  /**
   * @description keyboard space handler
   * **/
  handleSpace() {
    const element = this.isPlaceholderElement();
    if (element) {
      // placeholder element
      const cursorIndex = this.getCursorIndex(element);
      if (cursorIndex == element.innerText.trim().length) {
        // last character of placeholder
        const textElement = this.createTextElement(this.zeroWidthSpace);
        element.after(textElement);
        this.setCursorAt(textElement, 1);
      }
    }
  }
  /**
   * @description keyboard enter handler
   * **/
  handleEnter() {
    const element = this.isPlaceholderElement();
    if (element) {
      const cursorIndex = this.getCursorIndex(element);
      if (cursorIndex == 0) {
        // first character of placeholder
        const textElement = this.createTextElement(this.zeroWidthSpace);
        element.before(textElement);
        this.setCursorAt(textElement, 1);
      }
    }
  }
  /**
   * @description keyboard backspace handler
   * **/
  handleBackSpace() {
    const element = this.isPlaceholderElement();
    if (element) {
      const cursorIndex = this.getCursorIndex(element);
      if (cursorIndex == 1) {
        element.innerText = this.zeroWidthSpace + element.innerText;
        this.setCursorAt(element.firstChild, 2);
      }
    }
  }
  /**
   * @description Checking if the selection range element is a placeholder, returns the element or undefined
   * **/
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
  /**
   * @description Checking is selection range element is a text element, returns the element or undefined
   * **/
  isTextElement() {
    let result: HTMLElement | undefined;
    const element = this.getSelectionRangeElement();
    if (element) {
      if (element.nodeType == Node.TEXT_NODE) result = element;
    }
    return result;
  }
  /**
   * @description Checking if can insert placeholder at cursor, returns false if the cursor caret is already on a placeholder
   * **/
  canInsertPlaceholderAtCursor(savedRange: Range) {
    const container = savedRange.startContainer;
    const element = this.getInputElement(container);
    if (element.nodeType == Node.ELEMENT_NODE) {
      return !element.hasAttribute('placeholder');
    }
    return true;
  }
  /**
   * @description Converts initial string to html string, identifying the placeholders
   * **/
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
  /**
   * @description Converts html to formated string enclosing placeholders with delimiters
   * **/
  convertToText(element: ElementRef | undefined): string {
    if (element) {
      const cloneElement = element.nativeElement.cloneNode(true) as HTMLElement;
      this.formatElements([cloneElement]);
      return (cloneElement.textContent ?? '').trim().replace(/\s+/g, ' ');
    }
    return '';
  }
  /**
   * @description Create a placeholder element
   * **/
  createPlaceholderElement(placeholder: string): HTMLElement {
    const placeholderElement = this.renderer.createElement('span');
    placeholderElement.innerText = placeholder;
    placeholderElement.classList.add('placeholder');
    placeholderElement.setAttribute('contenteditable', 'true');
    placeholderElement.setAttribute('placeholder', 'true');
    return placeholderElement;
  }
  /**
   * @description Create a text element
   * **/
  createTextElement(text: string): Text {
    return document.createTextNode(text);
  }
  /**
   * @description Inserting a placeholder at cursor caret position
   * **/
  insertPlaceholderAtCursor(
    savedRange: Range | undefined,
    placeholder: string
  ) {
    const selection = window.getSelection();
    if (savedRange && selection) {
      if (this.canInsertPlaceholderAtCursor(savedRange)) {
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
      } else {
        const container = savedRange.startContainer;
        const element = this.getInputElement(container);
        this.insertPlaceholderAfter(element, placeholder);
      }
    }
  }
  /**
   * @description Inserting a placeholder after a specific html element
   * **/
  insertPlaceholderAfter(element: HTMLElement, placeholder: string) {
    const placeholderElement = this.createPlaceholderElement(placeholder);
    element.after(placeholderElement);
    this.setCursorAt(
      placeholderElement.firstChild,
      placeholderElement.innerText.length
    );
  }
  /**
   * @description Inserting a placeholder at the bottom of contenteditable element
   * **/
  insertPlaceholderAtBottom(
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
  /**
   * @description Set cursor caret at specific index of a node
   * **/
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
  /**
   * @description Get cursor caret index
   * **/
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
  /**
   * @description Get selection range
   * **/
  getSelectionRange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return undefined;
  }
  /**
   * @description Get selection range element
   * **/
  getSelectionRangeElement() {
    let element: HTMLElement | undefined;
    const range = this.getSelectionRange();
    if (range) {
      const container = range.startContainer;
      element = this.getInputElement(container);
    }
    return element;
  }
  /**
   * @description Get placeholder element or text node from range start container
   * **/
  private getInputElement(container: Node) {
    return (
      container.parentElement instanceof HTMLParagraphElement
        ? container
        : container.parentElement
    ) as HTMLElement;
  }
  /**
   * @description Placeholder element interaction handler
   * **/
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
  /**
   * @description Text element interaction handler
   * **/
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
  /**
   * @description Checking container to at least having a p tag always
   * **/
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
  /**
   * @description Formating placeholder elements to a final formated string, enclosing placeholders with delimiters
   * **/
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
  /**
   * @description Splitting placeholder from a text
   * **/
  private splitPlaceholder(text: string, placeholder: string) {
    const escapedSeparator = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.split(new RegExp(`(${escapedSeparator})`, 'g'));
  }
  /**
   * @description Splitting placeholders from a text
   * **/
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
  /**
   * @description Get left sibling element of an element
   * **/
  private getLeftSiblingElement(element: HTMLElement) {
    const parentElement = element.parentElement ?? element;
    return parentElement.childNodes.item(
      Array.from(parentElement.childNodes).indexOf(element) - 1
    );
  }
  /**
   * @description Get right sibling element of an element
   * **/
  private getRightSiblingElement(element: HTMLElement) {
    const parentElement = element.parentElement ?? element;
    return parentElement.childNodes.item(
      Array.from(parentElement.childNodes).indexOf(element) + 1
    );
  }
  /**
   * @description Get included placeholder from a text
   * **/
  private getIncludedPlaceholder(text: string): string | undefined {
    return this.placeholders.find(placeholder => text.includes(placeholder));
  }
  /**
   * @description Get matching placeholder from a text
   * **/
  private getMatchingPlaceholder(text: string): string | undefined {
    return this.placeholders.find(placeholder => text === placeholder);
  }
}
