import { CdkMenuModule } from '@angular/cdk/menu'
import { Store } from '@ngrx/store'
import { testName } from 'cypress/support/helpers'
import { FocusableDirective } from 'src/app/directives/focusable.directive'
import { MutationDirective } from 'src/app/directives/mutation.directive'
import { EntityType } from 'src/app/fullstack-shared-models/entities.model'
import { TaskPreviewFlattend, TaskPriority, TaskStatus } from 'src/app/fullstack-shared-models/task.model'
import { getEntityMenuItemsMap } from 'src/app/shared/entity-menu-items'
import { AppState } from 'src/app/store'
import { useStubsForActions } from 'src/app/utils/menu-item.helpers'
import { IconsModule } from '../../atoms/icons/icons.module'
import { InlineEditorComponent } from '../../atoms/inline-editor/inline-editor.component'
import { DropDownComponent } from '../../molecules/drop-down/drop-down.component'
import { TaskTreeNode } from '../task-tree/task-tree.component'
import { TaskComponent } from './task.component'

const taskMenuItems = getEntityMenuItemsMap({} as unknown as Store<AppState>)[EntityType.TASK]

const setupComponent = (
    data: TaskTreeNode,
    listeners?: {
        onToggleSubtasks?: (isExpanded: boolean) => void
        onStatusChange?: (status: TaskStatus) => void
        onTitleChange?: (title: string) => void
    },
    menuItemStubsMap?: Record<string, ReturnType<typeof cy.stub>>
) => {
    cy.mount(
        `<app-task
            [data]="data"
            [menuItems]="menuItems || []"
            (titleChange)="onTitleChange?.($event)"
            (expansionChange)="onToggleSubtasks?.($event)"
            (statusChange)="onStatusChange?.($event)"
        ></app-task>`,
        {
            componentProperties: {
                data,
                ...listeners,
                menuItems: taskMenuItems.map(useStubsForActions(menuItemStubsMap)),
            },
            imports: [CdkMenuModule, IconsModule],
            declarations: [
                TaskComponent,
                DropDownComponent,
                InlineEditorComponent,
                FocusableDirective,
                MutationDirective,
            ],
        }
    )
}

const taskFixture: TaskPreviewFlattend = {
    title: 'The title',
    childrenCount: 0,
    description: '',
    id: '',
    listId: '',
    parentTaskId: '',
    path: [],
    priority: TaskPriority.NONE,
    status: TaskStatus.OPEN,
}
const taskTreeNodeFixture: TaskTreeNode = {
    hasChildren: false,
    isExpanded: false,
    path: [],
    taskPreview: taskFixture,
}

describe('TaskComponent', () => {
    it('renders correctly', () => {
        setupComponent(taskTreeNodeFixture)

        cy.get(testName('task-title')).contains(taskFixture.title)
        cy.get(testName('task-priority-button')).should('not.exist')
        cy.get(testName('subtask-toggle')).should('not.exist')
        cy.get(testName('task-description')).should('not.exist')
    })

    describe('Title', () => {
        it('emits title updates', () => {
            const onTitleChange = cy.stub().as('onTitleChange')
            setupComponent(taskTreeNodeFixture, { onTitleChange })
            cy.contains(taskFixture.title) // wait for render to complete

            const updatedTitle = 'updated task title'

            cy.get(testName('task-title'))
                .get(testName('inline-editor'))
                .click()
                .type('{selectAll}{backspace}' + updatedTitle)
                .blur()
                .then(() => {
                    expect(onTitleChange).to.be.calledOnceWith(updatedTitle)
                })
        })
    })

    describe('Status', () => {
        it('emits status updates', () => {
            const onStatusChange = cy.stub().as('onStatusChange')
            const status = TaskStatus.IN_PROGRESS.replace('_', ' ')
            setupComponent(taskTreeNodeFixture, { onStatusChange }, { [status]: onStatusChange })

            cy.get(testName('task-status-button')).click()
            cy.get(testName('drop-down-menu'))
                .contains(status)
                .click()
                .then(() => {
                    expect(onStatusChange).to.be.calledOnceWith()
                })
        })
    })

    describe('Priority', () => {
        it('renders the priority', () => {
            const priority = TaskPriority.MEDIUM
            setupComponent({
                ...taskTreeNodeFixture,
                taskPreview: { ...taskFixture, priority },
            })
            cy.contains(taskFixture.title) // wait for render to complete

            cy.get(testName('task-priority-button')).should('exist')
        })
        it('does not render priority when task is closed', () => {
            const priority = TaskPriority.MEDIUM
            setupComponent({
                ...taskTreeNodeFixture,
                taskPreview: {
                    ...taskFixture,
                    status: TaskStatus.COMPLETED,
                    priority,
                },
            })
            cy.contains(taskFixture.title) // wait for render to complete

            cy.get(testName('task-priority-button')).should('not.exist')
        })

        it.skip('emits priority updates')
    })

    describe('Description', () => {
        it('renders the description', () => {
            const description = 'The test description'
            setupComponent({
                ...taskTreeNodeFixture,
                taskPreview: { ...taskFixture, description },
            })

            cy.get(testName('task-description')).contains(description)
        })

        it.skip('emits description updates')
    })

    describe('Subtasks', () => {
        const data = {
            ...taskTreeNodeFixture,
            hasChildren: true,
            taskPreview: { ...taskFixture, childrenCount: 1 },
        }
        it('displays the subtask toggle', () => {
            setupComponent(data)
            cy.contains(taskFixture.title) // wait for render to complete

            cy.get(testName('subtask-toggle')).should('exist')
        })

        it('emits toggle events', () => {
            const onToggleSubtasks = cy.stub().as('onToggleSubtasks')
            setupComponent(data, { onToggleSubtasks })
            cy.contains(taskFixture.title) // wait for render to complete

            cy.get(testName('subtask-toggle'))
                .click()
                .then(() => {
                    expect(onToggleSubtasks).to.be.calledOnceWith(true)
                })
        })
    })
})
