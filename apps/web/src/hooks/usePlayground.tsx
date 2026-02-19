
import { useReducer, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import {
    TypeRegistry,
    validateFields,
    createMinion as createMinionCore,
    generateId,
    RelationType
} from 'minions-core';
import { reducer, initialState, PlaygroundState } from '../lib/playground-state';

// Initialize registry once
const registry = new TypeRegistry();

interface PlaygroundContextType {
    state: PlaygroundState;
    setType: (slug: string) => void;
    setEditorValue: (value: string) => void;
    validate: () => void;
    createMinion: () => void;
    addRelation: (sourceId: string, targetId: string, type: RelationType) => void;
    removeRelation: (id: string) => void;
    removeMinion: (id: string) => void;
    setActiveTab: (tab: 'editor' | 'relations' | 'tree') => void;
    reset: () => void;
    registry: TypeRegistry;
}

const PlaygroundContext = createContext<PlaygroundContextType | null>(null);

export function PlaygroundProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Auto-validate on editor change (debounced manually or efficiently handled)
    // For simplicity, we just expose a validate function that effects call, or we can use useEffect
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const json = JSON.parse(state.editorValue);
                const type = registry.getBySlug(state.selectedTypeSlug);

                if (type) {
                    const result = validateFields(json.fields || {}, type.schema);
                    dispatch({ type: 'SET_VALIDATION_RESULT', payload: result });
                } else {
                    dispatch({ type: 'SET_VALIDATION_RESULT', payload: null });
                }
            } catch (e) {
                // invalid json
                dispatch({ type: 'SET_VALIDATION_RESULT', payload: { valid: false, errors: [{ field: 'JSON', message: 'Invalid JSON syntax' }] } });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [state.editorValue, state.selectedTypeSlug]);

    const setType = useCallback((slug: string) => {
        const type = registry.getBySlug(slug);
        if (!type) return;

        // Generate starter template
        const template = {
            title: `New ${type.name}`,
            fields: {} as Record<string, any>
        };

        // Pre-fill required fields with defaults or placeholders
        type.schema.forEach(field => {
            if (field.defaultValue !== undefined) {
                template.fields[field.name] = field.defaultValue;
            } else if (field.required) {
                template.fields[field.name] = field.type === 'array' ? [] :
                    field.type === 'number' ? 0 :
                        field.type === 'boolean' ? false :
                            "";
            }
        });

        dispatch({ type: 'SET_TYPE', payload: slug });
        dispatch({ type: 'SET_EDITOR_VALUE', payload: JSON.stringify(template, null, 2) });
    }, []);

    const setEditorValue = useCallback((value: string) => {
        dispatch({ type: 'SET_EDITOR_VALUE', payload: value });
    }, []);

    const validate = useCallback(() => {
        // Handled by useEffect, but exposed if needed (e.g. force check)
    }, []);

    const createMinion = useCallback(() => {
        try {
            const json = JSON.parse(state.editorValue);
            const type = registry.getBySlug(state.selectedTypeSlug);
            if (!type) {
                dispatch({ type: 'SET_VALIDATION_RESULT', payload: { valid: false, errors: [{ field: 'type', message: `Unknown minion type: ${state.selectedTypeSlug}` }] } });
                return;
            }

            const { minion, validation } = createMinionCore(json, type);
            if (!validation.valid) {
                dispatch({ type: 'SET_VALIDATION_RESULT', payload: validation });
                return;
            }
            dispatch({ type: 'CREATE_MINION', payload: minion });

            // Reset editor to new template for current type
            setType(state.selectedTypeSlug);

        } catch (e: any) {
            dispatch({ type: 'SET_VALIDATION_RESULT', payload: { valid: false, errors: [{ field: 'JSON', message: e.message || 'Failed to create minion' }] } });
        }
    }, [state.editorValue, state.selectedTypeSlug, setType]);

    const addRelation = useCallback((sourceId: string, targetId: string, type: RelationType) => {
        const relation = {
            id: generateId(),
            sourceId,
            targetId,
            type,
            createdAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_RELATION', payload: relation });
    }, []);

    const removeRelation = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_RELATION', payload: id });
    }, []);

    const removeMinion = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_MINION', payload: id });
    }, []);

    const setActiveTab = useCallback((tab: 'editor' | 'relations' | 'tree') => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
        // setType will be called by the effect below when selectedTypeSlug resets to 'agent'
    }, []);

    // Initialize editor template whenever the selected type changes (covers init, type switch, and reset)
    const prevTypeSlugRef = useRef<string | null>(null);
    useEffect(() => {
        if (prevTypeSlugRef.current !== state.selectedTypeSlug) {
            prevTypeSlugRef.current = state.selectedTypeSlug;
            setType(state.selectedTypeSlug);
        }
    }, [state.selectedTypeSlug, setType]);

    const value = {
        state,
        setType,
        setEditorValue,
        validate,
        createMinion,
        addRelation,
        removeRelation,
        removeMinion,
        setActiveTab,
        reset,
        registry
    };

    return (
        <PlaygroundContext.Provider value={value} >
            {children}
        </PlaygroundContext.Provider>
    );
}

export function usePlayground() {
    const context = useContext(PlaygroundContext);
    if (!context) {
        throw new Error('usePlayground must be used within a PlaygroundProvider');
    }
    return context;
}
