
export const flatAgentExample = JSON.stringify({
    "id": "agent-research-001",
    "title": "Research Assistant",
    "minionTypeId": "builtin-agent",
    "status": "active",
    "fields": {
        "role": "researcher",
        "model": "gpt-4",
        "systemPrompt": "You are a research assistant. You find, analyze, and summarize academic papers and articles on topics the user requests. Always cite your sources.",
        "temperature": 0.3,
        "maxTokens": 4096,
        "tools": ["web-search", "summarize", "cite"]
    },
    "tags": ["research", "ai-assistant"],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
}, null, 2);

export const nestedAgentExample = JSON.stringify({
    "agent": {
        "id": "agent-writer-001",
        "title": "Blog Writer",
        "minionTypeId": "builtin-agent",
        "status": "active",
        "fields": {
            "role": "writer",
            "model": "gpt-4",
            "systemPrompt": "You are a professional blog writer.",
            "temperature": 0.7,
            "tools": ["web-search", "grammar-check"]
        },
        "tags": ["content", "writing"],
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    },
    "children": [
        {
            "id": "thought-style-001",
            "title": "Writing Style Guide",
            "minionTypeId": "builtin-thought",
            "fields": {
                "content": "Use active voice, short paragraphs, and concrete examples. Target 8th-grade reading level. Always include a hook in the introduction.",
                "confidence": 0.9,
                "source": "editorial-guidelines"
            },
            "createdAt": "2024-01-15T10:01:00Z",
            "updatedAt": "2024-01-15T10:01:00Z"
        },
        {
            "id": "prompt-blog-001",
            "title": "Blog Post Template",
            "minionTypeId": "builtin-prompt-template",
            "fields": {
                "template": "Write a blog post about {{topic}}. Target audience: {{audience}}. Length: {{wordCount}} words. Include: introduction with hook, 3-5 main sections, conclusion with CTA.",
                "variables": ["topic", "audience", "wordCount"],
                "outputFormat": "markdown"
            },
            "createdAt": "2024-01-15T10:02:00Z",
            "updatedAt": "2024-01-15T10:02:00Z"
        },
        {
            "id": "test-quality-001",
            "title": "Content Quality Check",
            "minionTypeId": "builtin-test-case",
            "fields": {
                "input": { "topic": "AI agents", "audience": "developers", "wordCount": 800 },
                "expectedOutput": null,
                "assertions": {
                    "minWordCount": 600,
                    "maxWordCount": 1000,
                    "containsHeadings": true,
                    "readabilityScore": "8th-grade"
                },
                "timeout": 30000
            },
            "createdAt": "2024-01-15T10:03:00Z",
            "updatedAt": "2024-01-15T10:03:00Z"
        }
    ],
    "relations": [
        { "id": "rel-001", "sourceId": "agent-writer-001", "targetId": "thought-style-001", "type": "parent_of", "createdAt": "2024-01-15T10:01:00Z" },
        { "id": "rel-002", "sourceId": "agent-writer-001", "targetId": "prompt-blog-001", "type": "parent_of", "createdAt": "2024-01-15T10:02:00Z" },
        { "id": "rel-003", "sourceId": "agent-writer-001", "targetId": "test-quality-001", "type": "parent_of", "createdAt": "2024-01-15T10:03:00Z" }
    ]
}, null, 2);

export const teamExample = JSON.stringify({
    "team": {
        "id": "team-content-001",
        "title": "Content Creation Team",
        "minionTypeId": "builtin-team",
        "status": "active",
        "fields": {
            "members": ["agent-writer-001", "agent-editor-001", "agent-seo-001"],
            "strategy": "sequential",
            "maxConcurrency": 1
        },
        "tags": ["content", "team"],
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    },
    "agents": [
        {
            "id": "agent-writer-001",
            "title": "Writer",
            "minionTypeId": "builtin-agent",
            "fields": {
                "role": "writer",
                "model": "gpt-4",
                "systemPrompt": "You write first drafts of blog posts."
            },
            "createdAt": "2024-01-15T10:01:00Z",
            "updatedAt": "2024-01-15T10:01:00Z"
        },
        {
            "id": "agent-editor-001",
            "title": "Editor",
            "minionTypeId": "builtin-agent",
            "fields": {
                "role": "editor",
                "model": "gpt-4",
                "systemPrompt": "You review and improve blog post drafts for clarity, grammar, and style."
            },
            "createdAt": "2024-01-15T10:02:00Z",
            "updatedAt": "2024-01-15T10:02:00Z"
        },
        {
            "id": "agent-seo-001",
            "title": "SEO Optimizer",
            "minionTypeId": "builtin-agent",
            "fields": {
                "role": "seo-specialist",
                "model": "gpt-4",
                "systemPrompt": "You optimize blog posts for search engines.",
                "tools": ["keyword-research", "meta-tag-generator"]
            },
            "createdAt": "2024-01-15T10:03:00Z",
            "updatedAt": "2024-01-15T10:03:00Z"
        }
    ],
    "relations": [
        { "id": "rel-t1", "sourceId": "team-content-001", "targetId": "agent-writer-001", "type": "parent_of", "createdAt": "2024-01-15T10:01:00Z" },
        { "id": "rel-t2", "sourceId": "team-content-001", "targetId": "agent-editor-001", "type": "parent_of", "createdAt": "2024-01-15T10:02:00Z" },
        { "id": "rel-t3", "sourceId": "team-content-001", "targetId": "agent-seo-001", "type": "parent_of", "createdAt": "2024-01-15T10:03:00Z" },
        { "id": "rel-seq1", "sourceId": "agent-editor-001", "targetId": "agent-writer-001", "type": "follows", "createdAt": "2024-01-15T10:04:00Z" },
        { "id": "rel-seq2", "sourceId": "agent-seo-001", "targetId": "agent-editor-001", "type": "follows", "createdAt": "2024-01-15T10:05:00Z" }
    ]
}, null, 2);

export const thoughtExample = JSON.stringify({
    "id": "thought-001",
    "minionTypeId": "builtin-thought",
    "fields": {
        "content": "The user seems interested in structuring their agents more effectively.",
        "confidence": 0.85,
        "source": "user-interaction-analysis"
    }
}, null, 2);

export const promptExample = JSON.stringify({
    "id": "prompt-001",
    "minionTypeId": "builtin-prompt-template",
    "fields": {
        "template": "Analyze the following text: {{text}}. Extract entities and sentiment.",
        "variables": ["text"],
        "outputFormat": "json"
    }
}, null, 2);

export const testExample = JSON.stringify({
    "id": "test-001",
    "minionTypeId": "builtin-test-case",
    "fields": {
        "input": { "query": "Hello world" },
        "expectedOutput": { "reply": "Hi there!" },
        "assertions": { "latencyMs": 200 }
    }
}, null, 2);

export const taskExample = JSON.stringify({
    "id": "task-001",
    "minionTypeId": "builtin-task",
    "fields": {
        "input": { "file": "data.csv" },
        "executionStatus": "running",
        "startedAt": "2024-01-15T12:00:00Z"
    }
}, null, 2);
