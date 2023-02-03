import { interpolateParams } from '.'
import { MenuItem } from '../components/molecules/drop-down/drop-down.component'
import { TaskPreview } from '../fullstack-shared-models/task.model'

export const interceptItem = (callback: (item: MenuItem) => Partial<Omit<MenuItem, 'children'>>) => {
    return (item: MenuItem): MenuItem => {
        if (item.isSeperator) return item
        return {
            ...item,
            ...callback(item),
            children: item.children?.map(interceptItem(callback)),
        }
    }
}

export const useDataForAction = (data: unknown) => {
    return interceptItem(({ action }) => ({
        action: action && ((localData: unknown) => action(localData || data)),
    }))
}

export const interceptDataForAction = (callback: (data: unknown) => unknown) => {
    return interceptItem(({ action }) => ({
        action: action && ((localData: unknown) => action(callback(localData))),
    }))
}

export const useParamsForRoute = (params: Record<string, string | number>) => {
    return interceptItem(({ route }) => ({
        route: route && interpolateParams(route, params),
    }))
}

export const useTaskForActiveStatus = (task: Pick<TaskPreview, 'status'>) => {
    return (taskStatusItem: MenuItem): MenuItem => ({
        ...taskStatusItem,
        // @TODO: this will break once the icon is not equl to the status anymore
        isActive: task.status == taskStatusItem.icon,
    })
}
export const useTaskForActivePriority = (task: Pick<TaskPreview, 'priority'>) => {
    return (taskPriorityItem: MenuItem): MenuItem => ({
        ...taskPriorityItem,
        // @TODO: this will break once the icon is not equl to the status anymore
        isActive: task.priority == taskPriorityItem.icon,
    })
}
export const useTaskForActiveItems = (task: Pick<TaskPreview, 'status' | 'priority'>) => {
    return (item: MenuItem): MenuItem => {
        // define mappers for the children of specific items
        const machine = {
            Status: useTaskForActiveStatus,
            Priority: useTaskForActivePriority,
        }
        const mapper = !item.title ? null : machine[item.title as keyof typeof machine]

        if (!mapper) return item

        return {
            ...item,
            children: item.children?.map(mapper(task)),
        }
    }
}
