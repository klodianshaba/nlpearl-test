import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  companyName = 'NLPearl';
  welcome = `Unlock the Power of Conversation with ${this.companyName} and Transform Your Business Interactions`;
}
