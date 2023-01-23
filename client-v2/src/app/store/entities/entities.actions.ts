import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { HttpServerErrorResponse } from 'src/app/http/types'
import { EntityPreview } from 'src/app/fullstack-shared-models/entities.model'
import { CreateTasklistDto, TaskList } from 'src/app/fullstack-shared-models/list.model'
import { CreateTaskDto, TaskPreview, TaskPriority, TaskStatus } from 'src/app/fullstack-shared-models/task.model'
import { EntityCrudDto } from 'src/app/services/entities.service'
import { PartialRequired } from 'src/app/utils/type.helpers'

export type HttpServerErrorResponseWithData<T = { id: string }> = HttpServerErrorResponse & T

export const entitiesActions = createActionGroup({
    source: 'Entities',
    events: {
        'load previews': emptyProps(),
        'load previews success': props<{ previews: EntityPreview[] }>(),
        'load previews error': props<HttpServerErrorResponse>(),

        'load detail': props<EntityCrudDto>(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'load detail success': props<EntityCrudDto<{ entityDetail: Record<string, any> }>>(),
        'load detail error': props<HttpServerErrorResponseWithData>(),

        'open rename dialog': props<EntityCrudDto>(),
        'abort rename dialog': emptyProps(),
        //
        rename: props<EntityCrudDto<{ title: string; showToast?: boolean }>>(),
        'rename success': props<EntityCrudDto<{ title: string }>>(),
        'rename error': props<HttpServerErrorResponseWithData>(),

        'open delete dialog': props<EntityCrudDto>(),
        'abort delete dialog': emptyProps(),
        //
        delete: props<EntityCrudDto>(),
        'delete success': props<EntityCrudDto>(),
        'delete error': props<HttpServerErrorResponseWithData>(),
    },
})

export const listActions = createActionGroup({
    source: 'Entity/Lists',
    events: {
        'create task list': props<Partial<CreateTasklistDto>>(),
        'create task list success': props<{ createdList: TaskList }>(),
        'create task list error': props<HttpServerErrorResponse>(),

        'update description': props<{ id: string; newDescription: string }>(),
        'update description success': props<{ id: string; newDescription: string }>(),
        'update description error': props<HttpServerErrorResponseWithData>(),

        'duplicate list': props<{ id: string }>(),
        'duplicate list success': props<{ id: string }>(),
        'duplicate list error': props<{ id: string }>(),

        'export list': props<{ id: string }>(),
    },
})

export const taskActions = createActionGroup({
    source: 'Entity/Tasks',
    events: {
        'load task previews': emptyProps(),
        'load task previews success': props<{ previews: TaskPreview[] }>(),
        'load task previews error': props<HttpServerErrorResponse>(),

        'load root level tasks': props<{ listId: string }>(),
        'load root level tasks success': props<{ listId: string; tasks: TaskPreview[] }>(),
        'load root level tasks error': props<HttpServerErrorResponseWithData>(),

        create: props<PartialRequired<CreateTaskDto, 'listId'>>(),
        'create success': props<{ createdTask: TaskPreview }>(),
        'create error': props<HttpServerErrorResponseWithData>(),


        'update status': props<{ id: string; status: TaskStatus }>(),
        'update status success': props<{ id: string; status: TaskStatus }>(),
        'update status error': props<HttpServerErrorResponseWithData>(),

        'update priority': props<{ id: string; priority: TaskPriority }>(),
        'update priority success': props<{ id: string; priority: TaskPriority }>(),
        'update priority error': props<HttpServerErrorResponseWithData>(),

        'update description': props<{ id: string; newDescription: string }>(),
        'update description success': props<{ id: string; newDescription: string }>(),
        'update description error': props<HttpServerErrorResponseWithData>(),
    },
})
