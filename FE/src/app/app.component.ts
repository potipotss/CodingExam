import { Component, OnDestroy } from '@angular/core';
import { Base64Service } from './base64.service';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnDestroy {
  inputText = '';
  result: string[] = []; // Change to an array of strings
  private encodeSubscription: Subscription | undefined;
  private hubConnection: HubConnection;
  encodingCompleted = false; // Reset the flag
  completedMessage = '';
  isEncodingInProgress = false;
  encodingCancelled = false;
  constructor(private base64Service: Base64Service) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7083/base64Hub') 
      .build();

    this.hubConnection.on('PartialResult', (partialResult: string) => {
      this.result.push(partialResult); 
    });

    this.hubConnection.start()
      .then(() => console.log('Hub connection started'))
      .catch(err => console.error('Error while starting hub connection', err));
  }

  encode() {
    this.encodingCancelled = false;
    this.result = []; 
    this.isEncodingInProgress = true;
    this.encodeSubscription = this.base64Service.encode(this.inputText).subscribe(
      (response: any) => {
        if(response.message){
          this.encodingCompleted = true;
          this.completedMessage = response.message;
        }
      },
      (error) => {
        console.error(error);
      },
      () => {
        console.log('Encoding process completed.');
        this.isEncodingInProgress = false;
      }
    );
  }

  cancel() {
    if (this.isEncodingInProgress) {
      if (this.encodeSubscription) {
        this.encodeSubscription.unsubscribe();
        console.log('Encoding process canceled.');
        this.isEncodingInProgress = false;
        this.encodingCancelled = true;
        this.base64Service.cancel().subscribe(
          (response: any) => {
            console.log('Cancel request sent successfully.', response);
          },
          (error) => {
            console.error('Error sending cancel request.', error);
          }
        );
      }
    } else {
      console.log('No encoding process in progress to cancel.');
    }
  }
  
  ngOnDestroy() {
    if (this.encodeSubscription) {
      this.encodeSubscription.unsubscribe();
    }
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
