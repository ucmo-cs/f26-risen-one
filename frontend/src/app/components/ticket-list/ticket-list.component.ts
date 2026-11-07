import { Component } from '@angular/core';

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent {
  tickets = [
    { number: 4, title: "Can't log in", status: 'To Do' },
    { number: 5, title: 'Password reset', status: 'To Do' },
    { number: 6, title: 'Page issue fix', status: 'Done' },
    { number: 7, title: 'Form bug', status: 'In Review' },
    { number: 8, title: 'Email issue', status: 'In Progress' },
    { number: 9, title: 'Test ticket from AWS', status: 'To Do' }
  ];
}
