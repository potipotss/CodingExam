import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Base64Service {

  private apiUrl = 'https://localhost:7083/api/base64'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  encode(text: string): Observable<string> {
    // Set headers to indicate JSON content
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<string>(`${this.apiUrl}/encode`, `"${text}"` , { headers });
  }


  cancel(): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<string>(`${this.apiUrl}/cancel`, {}, { headers });
  }
}