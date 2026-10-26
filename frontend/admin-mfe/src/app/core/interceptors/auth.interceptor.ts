import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { getAuthToken, getApiUrl } from '../utils/api-url.utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getAuthToken();
  const targetUrl = getApiUrl(req.url);

  let authReq = req.clone({
    url: targetUrl,
    withCredentials: true,
  });

  if (token && !req.headers.has('Authorization')) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      return throwError(() => error);
    })
  );
};

