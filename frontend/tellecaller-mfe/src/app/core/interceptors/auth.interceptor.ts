import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { getAuthToken, getApiUrl } from '../utils/api-url.utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken() || getAuthToken();

  let authReq = req.clone({ url: getApiUrl(req.url), withCredentials: true });
  if (token && !req.headers.has('Authorization')) {
    authReq = authReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) auth.handleUnauthorized();
      return throwError(() => error);
    }),
  );
};
