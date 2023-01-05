export interface TaskList {
    id: string
    name: string
    description: string | null
    createdAt: string
    ownerId: string

    parentListId: string
    childLists: string[]
    taskIds: string[]
    // participants: string[] // maybe this one as well
}

export type TasklistPreview = Pick<TaskList, 'id' | 'name' | 'childLists' | 'parentListId'>

export type TasklistDetail = Pick<TaskList, 'description' | 'ownerId' | 'createdAt'>

export interface CreateTasklistDto {
    name: string
    description?: string
    parentListId?: string
}
export type UpdateTasklistDto = Partial<CreateTasklistDto>

export interface PermissionsDto {
    permission: ListPermissions
}
export type ShareTasklistDto = Partial<PermissionsDto>

export enum ListPermissions {
    Manage = 'Manage',
    Edit = 'Edit',
    Comment = 'Comment',
    View = 'View',
}
