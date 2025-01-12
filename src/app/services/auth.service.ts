import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  username: string;
  authorities: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'https://web-client-departamental02.onrender.com/api/v1/products';
  private isBrowser: boolean;

  private userPasswords: { [key: string]: string } = {
    'admin': 'admin',
    'user': 'user',
    'moderator': 'moderator',
    'editor': 'editor',
    'developer': 'developer',
    'analyst': 'analyst'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    let storedUser = null;

    if (this.isBrowser) {
      storedUser = localStorage.getItem('currentUser');
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    // Verificar si las credenciales son correctas
    if (this.userPasswords[username] !== password) {
      return new Observable(subscriber => {
        subscriber.error({ status: 401, message: 'Credenciales inválidas' });
      });
    }

    // Crear las credenciales en formato Base64
    const credentials = btoa(`${username}:${password}`);
    
    // Configurar los headers
    const headers = new HttpHeaders({
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(this.apiUrl, { headers }).pipe(
      map(() => {
        // Asignar autoridades según el usuario
        const authorities = this.getPermissionsByRole(username);
        
        const user = {
          username,
          authorities
        };

        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('credentials', credentials);
        }

        this.currentUserSubject.next(user);
        return user;
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('credentials');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasAuthority(authority: string): boolean {
    const user = this.currentUserValue;
    if (!user) {
      return false;
    }
    return user.authorities.includes(authority);
  }

  getPermissionsByRole(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      admin: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      user: ['READ'],
      moderator: ['READ', 'UPDATE'],
      editor: ['UPDATE'],
      developer: ["READ", "WRITE", "CREATE", "UPDATE", "DELETE", "CREATE-USER"],
      analyst: ['READ', 'DELETE']
    };
    return permissions[role] || [];
  }

  getAuthHeaders(): { [header: string]: string } {
    const credentials = localStorage.getItem('credentials');
    if (credentials) {
      return {
        Authorization: `Basic ${credentials}`
      };
    }
    return {};
  }
}
