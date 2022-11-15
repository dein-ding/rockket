import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './guards/auth.guard'
import { LoginComponent } from './pages/auth/login/login.component'
import { SignupComponent } from './pages/auth/signup/signup.component'
import { ComponentPlaygroundComponent } from './pages/component-playground/component-playground.component'
import { HomeComponent } from './pages/home/home.component'
import { LandingPageComponent } from './pages/landing-page/landing-page.component'
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component'
import { SettingsAccountComponent } from './pages/settings/account/account.component'
import { SettingsAppearanceComponent } from './pages/settings/appearance/appearance.component'
import { SettingsGeneralComponent } from './pages/settings/general/general.component'
import { SettingsComponent } from './pages/settings/settings.component'

const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent,
        pathMatch: 'full',
    },
    {
        path: 'auth/login',
        component: LoginComponent,
    },
    {
        path: 'auth/signup',
        component: SignupComponent,
    },
    {
        path: 'auth',
        pathMatch: 'full',
        redirectTo: 'auth/login',
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'general',
            },
            { path: 'general', component: SettingsGeneralComponent },
            { path: 'account', component: SettingsAccountComponent },
            { path: 'appearance', component: SettingsAppearanceComponent },
        ],
    },
    {
        path: 'playground',
        component: ComponentPlaygroundComponent,
    },
    {
        path: '**',
        component: NotFoundPageComponent,
    },
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
