import { AsyncPipe } from '@angular/common'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BehaviorSubject } from 'rxjs'
import { actionsMock, storeMock } from 'src/app/utils/unit-test.mocks'
import { EntityViewComponent, EntityViewData, ENTITY_VIEW_DATA } from '../../entity-view.component'

import { TaskViewComponent } from './task-view.component'
import { RxModule } from 'src/app/rx/rx.module'

describe('TaskViewComponent', () => {
    let component: TaskViewComponent
    let fixture: ComponentFixture<TaskViewComponent>

    beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entityViewDataMock: EntityViewData<any> = {
            detail$: new BehaviorSubject(null),
            entity$: new BehaviorSubject(null),
            options$: new BehaviorSubject(null),
        }
        await TestBed.configureTestingModule({
            declarations: [TaskViewComponent],
            providers: [
                { provide: ENTITY_VIEW_DATA, useValue: entityViewDataMock },
                storeMock,
                actionsMock,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                { provide: EntityViewComponent, useValue: { progress$: { next() {} } } },
            ],
            imports: [AsyncPipe, RxModule],
        }).compileComponents()

        fixture = TestBed.createComponent(TaskViewComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })
})
