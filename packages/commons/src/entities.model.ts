import { TaskList } from './list/list.model'
import { Task } from './task/task.model'

export enum EntityType {
    TASKLIST = 'Tasklist',
    TASK = 'Task',
    // DOCUMENT = 'Document',
    // VIEW = 'View',
}

type BaseEntityPreview = {
    id: string
    entityType: EntityType
    title: string
    parentId: string | undefined
}

export type TaskEntityPreview = BaseEntityPreview & { entityType: EntityType.TASK } & Task
export type TasklistEntityPreview = BaseEntityPreview & { entityType: EntityType.TASKLIST }

export type EntityPreview = TaskEntityPreview | TasklistEntityPreview

export type EntityPreviewRecursive = EntityPreview & {
    children: EntityPreviewRecursive[] | undefined
}
export type EntityPreviewFlattend = Omit<EntityPreviewRecursive, 'children'> & {
    path: string[]
    childrenCount: number | undefined
}

export type EntitiesSearchResultDto = Record<EntityType, unknown> & {
    [EntityType.TASK]: Task[]
    [EntityType.TASKLIST]: TaskList[]
}
