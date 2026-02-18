
import { Minion, Relation, ValidationResult } from '@minions/core';

export interface PlaygroundState {
    selectedTypeSlug: string;
    editorValue: string;
    minions: Minion[];
    relations: Relation[];
    validationResult: ValidationResult | null;
    activeTab: 'editor' | 'relations' | 'tree';
}

export type Action =
    | { type: 'SET_TYPE'; payload: string }
    | { type: 'SET_EDITOR_VALUE'; payload: string }
    | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult | null }
    | { type: 'CREATE_MINION'; payload: Minion }
    | { type: 'ADD_RELATION'; payload: Relation }
    | { type: 'REMOVE_RELATION'; payload: string }
    | { type: 'REMOVE_MINION'; payload: string }
    | { type: 'SET_ACTIVE_TAB'; payload: 'editor' | 'relations' | 'tree' }
    | { type: 'RESET' };

export const initialState: PlaygroundState = {
    selectedTypeSlug: 'agent', // Default to agent
    editorValue: JSON.stringify({ title: "My Agent", minionTypeId: "builtin-agent", fields: {} }, null, 2),
    minions: [],
    relations: [],
    validationResult: null,
    activeTab: 'editor',
};

export function reducer(state: PlaygroundState, action: Action): PlaygroundState {
    switch (action.type) {
        case 'SET_TYPE':
            return { ...state, selectedTypeSlug: action.payload };
        case 'SET_EDITOR_VALUE':
            return { ...state, editorValue: action.payload };
        case 'SET_VALIDATION_RESULT':
            return { ...state, validationResult: action.payload };
        case 'CREATE_MINION':
            return { ...state, minions: [...state.minions, action.payload] };
        case 'ADD_RELATION':
            return { ...state, relations: [...state.relations, action.payload] };
        case 'REMOVE_RELATION':
            return {
                ...state,
                relations: state.relations.filter(r => r.id !== action.payload)
            };
        case 'REMOVE_MINION':
            return {
                ...state,
                minions: state.minions.filter(m => m.id !== action.payload),
                relations: state.relations.filter(r => r.sourceId !== action.payload && r.targetId !== action.payload)
            };
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'RESET':
            return { ...initialState };
        default:
            return state;
    }
}
