import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core'
import { MenuService } from './menu.service'

@Component({
    selector: 'app-sidebar-layout',
    templateUrl: './sidebar-layout.component.html',
    styleUrls: ['./sidebar-layout.component.css'],
})
export class SidebarLayoutComponent implements AfterViewInit, OnDestroy {
    constructor(private menuService: MenuService) {}

    @Input() enableResize = true

    isMenuOpen$ = this.menuService.isMenuOpen$

    @ViewChild('resizeHandle') resizeHandle!: ElementRef<HTMLDivElement>

    ngAfterViewInit(): void {
        if (this.enableResize) {
            this.resizeHandle.nativeElement.addEventListener('mousedown', this.onMouseDown)
            document.addEventListener('mouseup', this.onMouseUp)
        }

        this.observer.observe(this.sidebarScrollSpy.nativeElement)
    }
    ngOnDestroy(): void {
        if (this.enableResize) {
            this.resizeHandle.nativeElement.removeEventListener('mousedown', this.onMouseDown)
            document.removeEventListener('mouseup', this.onMouseUp)
        }

        this.observer.disconnect()
    }

    // in case: https://stackoverflow.com/questions/26233180/resize-a-div-on-border-drag-and-drop-without-adding-extra-markup

    onMouseDown = (() => document.addEventListener('mousemove', this.onResize)).bind(this)
    onMouseUp = (() => document.removeEventListener('mousemove', this.onResize)).bind(this)

    onResize = ((e: MouseEvent) => {
        const sidebar = this.resizeHandle.nativeElement.parentElement as HTMLDivElement
        const currMouseX = e.clientX
        const newWidth = currMouseX + 'px'
        sidebar.style.width = newWidth
    }).bind(this)

    isSidebarScrolled = false
    @ViewChild('sidebarScrollSpy') sidebarScrollSpy!: ElementRef<HTMLDivElement>

    observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.target == this.sidebarScrollSpy.nativeElement) this.isSidebarScrolled = !entry.isIntersecting
            })
        },
        { threshold: [1] }
    )
}
