// logs.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Log } from '../models/log.model';
import { AuthService } from './auth.service';

export interface Product {
  id: number,
  name: string,
  description: string,
  price: number,
  stock: number,
  created_at: string
}

interface ApiResponse {
  estado: number;
  msg: string;
  expenses: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private apiUrl = 'https://web-client-departamental02.onrender.com/api/v1/products';


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getLogs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl, { headers: this.authService.getAuthHeaders() });
  }

  /*getLogs(): Observable<Log[]> {
    return this.http.get<Log[]>(this.apiUrl, { headers: this.authService.getAuthHeaders() });
  }*/

  getLog(id: number): Observable<Log> {
    return this.http.get<Log>(`${this.apiUrl}/${id}`, { headers: this.authService.getAuthHeaders() });
  }

  createLog(log: Partial<Log>): Observable<Log> {
    return this.http.post<Log>(this.apiUrl, log, { headers: this.authService.getAuthHeaders() });
  }

  updateLog(id: number, log: Partial<Log>): Observable<Log> {
    return this.http.put<Log>(`${this.apiUrl}/${id}`, log, { headers: this.authService.getAuthHeaders() });
  }

  deleteLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.authService.getAuthHeaders() });
  }
}