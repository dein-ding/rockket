import { ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { coalesceWith } from '@rx-angular/cdk/coalescing'
import {
    Observable,
    ReplaySubject,
    Subject,
    delay,
    distinctUntilKeyChanged,
    filter,
    map,
    merge,
    mergeWith,
    share,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
    timer,
    withLatestFrom,
} from 'rxjs'
import { AppEditor } from '../app-editor'
import { EditorFeature } from '../editor.types'
import { EDITOR_FEATURES_TOKEN } from '../editor.features'
import { isChecklistItem } from '../editor.helpers'

@UntilDestroy()
@Component({
    selector: 'app-tt-editor',
    templateUrl: './tip-tap-editor.component.html',
    styleUrls: ['./tip-tap-editor.component.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block',
    },
})
export class TipTapEditorComponent<TContext = unknown> implements OnDestroy {
    constructor(@Inject(EDITOR_FEATURES_TOKEN) public features: EditorFeature[]) {}

    ngOnDestroy(): void {
        this.editor?.destroy()
    }

    @Input() set editable(editable: boolean) {
        this.editor?.setEditable(editable)
    }
    get editable() {
        return this.editor?.isEditable ?? true
    }

    private searchTerm$ = new ReplaySubject<string>(1)
    @Input() set searchTerm(searchTerm: string | null) {
        if (searchTerm !== null) this.searchTerm$.next(searchTerm)
    }

    editor = new AppEditor({
        editable: this.editable,
        extensions: this.features.flatMap(feature => feature.extensions),
    })

    private focusStateInput$ = new Subject<boolean>()
    updateFocusState(isFocused: boolean) {
        this.focusStateInput$.next(isFocused)
    }

    @Output() focus$ = this.editor.focus$.pipe(map(({ event }) => event))
    @Output('blur') blur$ = this.editor.blur$.pipe(
        filter(({ event }) => {
            const clickedElem = event.relatedTarget as HTMLElement | undefined

            // check if a control from the toolbar was clicked
            const isControlClicked =
                clickedElem?.className?.includes('format-control-item') ||
                clickedElem?.className?.includes('format-controls-container') ||
                clickedElem?.className?.includes('keep-editor-focus') ||
                clickedElem?.parentElement?.className?.includes('format-controls-container') ||
                clickedElem?.parentElement?.className?.includes('keep-editor-focus')
            if (isControlClicked) return false

            // check if a task item was clicked (only inside the current editor)
            if (isChecklistItem(clickedElem) && this.editor.view.dom.contains(clickedElem as Node)) return false

            // -> Its good to explicitly allow elems instead of blindly ignoring everything from inside the editor

            return true
        }),
        tap(() => this.editor.deselect()),
        map(({ event }) => event),
        mergeWith(this.focusStateInput$.pipe(filter((isFocused): isFocused is false => !isFocused))),
        share({ resetOnRefCountZero: true })
    )

    @Output('isActive') isActive$ = merge(this.focus$, this.blur$).pipe(
        map(() => this.editor.isFocused),
        coalesceWith(timer(70)),
        mergeWith(this.editor.unbind$.pipe(map(() => false))), // because we blur the editor when (un)binding
        startWith(false),
        untilDestroyed(this),
        shareReplay({ bufferSize: 1, refCount: true })
    )

    private bindConfig$ = new Subject<{ input$: Observable<string>; context: TContext }>()
    @Input() set bind(bound: { input$: Observable<string>; context: TContext }) {
        this.bindConfig$.next(bound)
    }
    private bound$ = this.bindConfig$.pipe(
        untilDestroyed(this),
        map(({ input$, context }) => this.bindEditor(input$, context)),
        share({ resetOnRefCountZero: true })
    )

    @Output('update') update$ = this.bound$.pipe(
        switchMap(({ update$ }) => update$),
        share({ resetOnRefCountZero: true })
    )
    @Output('updateOnBlur') updateOnBlur$ = this.bound$.pipe(
        switchMap(({ updateOnBlur$ }) => updateOnBlur$),
        share({ resetOnRefCountZero: true })
    )

    private bindEditor<TContext>(input$: Observable<string>, context: TContext, searchTerm$?: Observable<string>) {
        const searchTerm$_ = searchTerm$ ? searchTerm$.pipe(mergeWith(this.searchTerm$)) : this.searchTerm$
        const bound = this.editor.bindEditor(input$, searchTerm$_)
        return {
            ...bound,
            updateOnBlur$: merge(this.blur$, this.editor.unbind$).pipe(
                withLatestFrom(bound.update$, input$.pipe(startWith(null))),
                map(([, { html, plainText }, lastInput]) => ({ html, plainText, lastInput, context })),
                filter(({ html, plainText, lastInput }) => html != lastInput || plainText != lastInput),
                distinctUntilKeyChanged('html'),
                untilDestroyed(this),
                // Must be delayed so that `unbind$` triggers a last update before the bound is destroyed,
                // to make sure all transactions are dispatched.
                takeUntil(this.editor.unbind$.pipe(delay(0))),
                share({ resetOnRefCountZero: true })
            ),
        }
    }
}
