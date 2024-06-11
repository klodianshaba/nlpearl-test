import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-placeholders',
  standalone: true,
  imports: [],
  templateUrl: './placeholders.component.html',
  styleUrl: './placeholders.component.scss',
})
export class PlaceholdersComponent {
  placeholders = input<string[]>([]);
  onPlaceholder = output<string>();
}
