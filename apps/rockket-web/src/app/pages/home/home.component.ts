import { ArrayDataSource } from '@angular/cdk/collections'
import { FlatTreeControl } from '@angular/cdk/tree'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { Store } from '@ngrx/store'
import { Action } from '@ngrx/store/src/models'
import { EntityPreviewFlattend, EntityType, Task } from '@rockket/commons'
import { combineLatestWith, map, tap } from 'rxjs'
import { CommandPaletteService } from 'src/app/command-palette/command-palette.service'
import { MenuService } from 'src/app/components/templates/sidebar-layout/menu.service'
import { MenuItem } from 'src/app/dropdown/drop-down/drop-down.component'
import { DeviceService } from 'src/app/services/device.service'
import { LoadingStateService } from 'src/app/services/loading-state.service'
import { UiStateService } from 'src/app/services/ui-state.service'
import { getEntityMenuItemsMap } from 'src/app/shared/entity-menu-items'
import { AppState } from 'src/app/store'
import { entitiesActions } from 'src/app/store/entities/entities.actions'
import { entitiesSelectors } from 'src/app/store/entities/entities.selectors'
import { listActions } from 'src/app/store/entities/list/list.actions'
import { taskActions } from 'src/app/store/entities/task/task.actions'
import { flattenEntityTreeIncludingTasks } from 'src/app/store/entities/utils'
import { useTaskForActiveItems } from 'src/app/utils/menu-item.helpers'

export interface EntityTreeNode {
    id: string
    title: string
    path: string[] // <-- level: path.length
    expandable: boolean

    isExpanded: boolean
    entityType: EntityType

    menuItems: MenuItem[]
}

export const convertToEntityTreeNode = (entity: EntityPreviewFlattend): EntityTreeNode => {
    const { childrenCount, ...restEntity } = entity
    const node: EntityTreeNode = {
        ...restEntity,
        expandable: (childrenCount || 0) > 0,
        isExpanded: false,
        menuItems: [],
    }
    return node
}

@UntilDestroy()
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    constructor(
        private store: Store<AppState>,
        private loadingService: LoadingStateService,
        private deviceService: DeviceService,
        private menuService: MenuService,
        private uiStateService: UiStateService,
        private commandPaletteService: CommandPaletteService,
    ) {}

    openQuickSearch() {
        this.commandPaletteService.navigateToSelectedEntity()
    }

    EntityType = EntityType

    // @TODO: lets have a look at this again when socket integration is ready
    shouldFetchSubcription = this.deviceService.shouldFetch$.pipe(untilDestroyed(this)).subscribe(index => {
        if (index == 0) {
            this.store.dispatch(entitiesActions.loadPreviews())
            this.store.dispatch(taskActions.loadTaskPreviews())
            return
        }

        this.store.dispatch(entitiesActions.reloadPreviews())
        this.store.dispatch(taskActions.reloadTaskPreviews())
    })

    isMobileScreen$ = this.deviceService.isMobileScreen$

    getParentNode(node: EntityTreeNode) {
        const nodeIndex = this.entityPreviewsTransformed.indexOf(node)

        for (let i = nodeIndex - 1; i >= 0; i--) {
            if (this.entityPreviewsTransformed[i].path.length === node.path.length - 1) {
                return this.entityPreviewsTransformed[i]
            }
        }

        return null
    }

    shouldRender(node: EntityTreeNode) {
        let parent = this.getParentNode(node)
        while (parent) {
            if (!parent.isExpanded) {
                return false
            }
            parent = this.getParentNode(parent)
        }
        return true
    }

    // Changes are automatically reflected here, since it always stays the same object identity
    entityExpandedMap = this.uiStateService.sidebarUiState.entityExpandedMap
    toggleExpansion(node: EntityTreeNode) {
        node.isExpanded = !node.isExpanded
        this.uiStateService.toggleSidebarEntity(node.id, node.isExpanded)
    }

    range(number: number) {
        return new Array(number)
    }

    // @TODO: Add trackByFn

    entityPreviewsTransformed: EntityTreeNode[] = []
    entityPreviewsTransformed$ = this.store
        .select(state => state.entities.entityTree)
        .pipe(
            combineLatestWith(this.store.select(entitiesSelectors.taskTreeMap)),
            map(([entityTree, taskTreeMap]) => {
                if (!entityTree) return null

                const flattendEntityTree = flattenEntityTreeIncludingTasks(entityTree, taskTreeMap || {})
                const treeNodes = flattendEntityTree.map(convertToEntityTreeNode)

                return treeNodes.map<EntityTreeNode>(node => {
                    return {
                        ...node,
                        isExpanded: this.entityExpandedMap.get(node.id) ?? false,
                        menuItems: this.nodeMenuItemsMap[node.entityType].map(
                            useTaskForActiveItems(node as EntityTreeNode & Task),
                        ),
                    }
                })
            }),
            tap(transformed => {
                if (transformed) this.entityPreviewsTransformed = transformed
                else this.entityPreviewsTransformed = []
            }),
        )
    private readonly nodeMenuItemsMap = getEntityMenuItemsMap(this.store)

    isTreeLoading$ = this.loadingService.getLoadingState([
        entitiesActions.loadPreviews,
        entitiesActions.loadPreviewsSuccess,
        entitiesActions.loadPreviewsError,
    ])

    isSelected: Record<string, boolean> = {}
    nodeLoadingMap$ = this.loadingService.getEntitiesLoadingStateMap()

    dataSource = new ArrayDataSource(this.entityPreviewsTransformed$.pipe(map(nodes => nodes || [])))
    treeControl = new FlatTreeControl<EntityTreeNode>(
        node => node.path.length,
        node => node.expandable,
    )

    createNewList(parentListId?: string) {
        this.store.dispatch(listActions.createTaskList({ parentListId }))
    }
    createChild(id: string, entityType: EntityType) {
        const machine: Record<EntityType, Action> = {
            [EntityType.Tasklist]: listActions.createTaskList({ parentListId: id }),
            [EntityType.Task]: taskActions.create({ parentTaskId: id }),
        }
        this.store.dispatch(machine[entityType])
    }

    closeMobileMenu() {
        this.menuService.isMenuOpen$.next(false)
    }
}
