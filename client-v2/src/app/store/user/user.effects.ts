import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { HotToastService } from '@ngneat/hot-toast'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { catchError, map, mergeMap, Observable, of, tap } from 'rxjs'
import { HttpServerErrorResponse } from 'src/app/http/types'
import { AuthSuccessResponse, SignupCredentialsDto } from 'src/app/models/auth.model'
import { UserService } from 'src/app/services/user.service'
import { appActions } from '../app.actions'
import { userActions } from './user.actions'

@Injectable()
export class UserEffects {
    constructor(
        private actions$: Actions,
        private userService: UserService,
        private toast: HotToastService,
        private router: Router
    ) {}

    loginOrSignup = createEffect(() => {
        return this.actions$.pipe(
            ofType(userActions.login, userActions.signup),
            mergeMap(({ type, credentials, callbackUrl }) => {
                const isLogin = /login/.test(type)
                const res$: Observable<AuthSuccessResponse> = isLogin
                    ? this.userService.login(credentials)
                    : this.userService.signup(credentials as SignupCredentialsDto)

                return res$.pipe(
                    this.toast.observe({
                        success: res => res.successMessage,
                        error: (err: HttpServerErrorResponse) =>
                            err.error.message instanceof Array
                                ? err.error.message[0].replace(/^\w+:/, '')
                                : err.error.message.replace(/^\w+:/, ''),
                    }),
                    map(res => {
                        if (callbackUrl) this.router.navigateByUrl(callbackUrl)

                        return userActions.loginOrSignupSuccess(res.user)
                    }),
                    catchError((err: HttpServerErrorResponse) => of(userActions.loginOrSignupError(err)))
                )
            })
        )
    })

    saveAuthToken = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.loginOrSignupSuccess),
                tap(({ authToken }) => this.userService.saveToken(authToken))
            ),
        { dispatch: false }
    )

    loadSavedAuthToken = createEffect(() => {
        return this.actions$.pipe(
            ofType('@ngrx/effects/init'),
            map(() => {
                const authToken = this.userService.getToken()
                if (authToken) return userActions.loadAuthTokenSuccess({ authToken })
                else return appActions.nothing()
            })
        )
    })

    forwardToConfirmLogin = createEffect(() => {
        return this.actions$.pipe(
            ofType(userActions.loadAuthTokenSuccess),
            map(() => userActions.confirmLogin())
        )
    })
    confirmLogin = createEffect(() => {
        return this.actions$.pipe(
            ofType(userActions.confirmLogin),
            mergeMap(() => {
                const res$ = this.userService.confirmLogin()

                return res$.pipe(
                    this.toast.observe({
                        success: { content: res => res.successMessage, duration: 900 },
                        // @TODO: this is in place of a proper loading screen, for the AuthGuard blocking a route
                        loading: {
                            content: 'Confirming login...',
                            id: 'confirm-login', // Explicitly dismiss this toast from anywhere with `toast.close('confirm-login')`
                        },
                        error: {
                            content: 'Invalid session, please login again.',
                            id: 'confirm-login',
                        },
                    }),
                    map(res => {
                        const isOnAuthPage = this.router.url.includes('auth')
                        if (isOnAuthPage) this.router.navigateByUrl('/home')

                        return userActions.loginOrSignupSuccess(res.user)
                    }),
                    catchError(() => of(userActions.confirmLoginError()))
                )
            })
        )
    })
}
