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

  handleInteraction(
    editableElement: HTMLElement | undefined,
    placeholders: string[]
  ) {
    this.placeholders = placeholders;
    const range = this.getSelectionRange();
    if (range) {
      const container = range.startContainer;
      const element = this.getInteractionElement(container);
      this.checkContainer(editableElement, container);

      if (element.nodeType == Node.ELEMENT_NODE) {
        this.handlePlaceholderInteraction(element);
      } else if (element.nodeType == Node.TEXT_NODE) {
        this.handleTextInteraction(element);
      }
    }
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

  insertAtCursor(savedRange: Range | null, placeholder: string) {
    const selection = window.getSelection();
    if (savedRange && selection) {
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
    return null;
  }

  private handlePlaceholderInteraction(element: HTMLElement) {
    const text = element.textContent ?? '';
    const parentElement = element.parentElement ?? element;
    const leftSiblingElement = this.getLeftSiblingElement(element);
    const rightSiblingElement = this.getRightSiblingElement(element);
    const placeholder = this.getMatchingPlaceholder(text);
    if (element?.hasAttribute('placeholder')) {
      if (!placeholder) {
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

  private handleTextInteraction(element: HTMLElement) {
    const text = element.textContent ?? '';
    const parentElement = element.parentElement ?? element;
    const placeholder = this.getIncludedPlaceholder(text);
    if (placeholder) {
      // placeholder included
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

  private checkContainer(element: HTMLElement | undefined, container: Node) {
    if (element) {
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

  private getInteractionElement(container: Node) {
    return (
      container.parentElement instanceof HTMLParagraphElement
        ? container
        : container.parentElement
    ) as HTMLElement;
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
