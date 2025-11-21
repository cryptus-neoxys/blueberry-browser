# PRD: Personal Brain - Local-First Memory Layer

## Introduction/Overview

The Personal Brain feature introduces a local-first memory system for Blueberry Browser that captures and stores user browsing context and chat interactions. This creates a foundation for enhanced AI assistance by providing persistent memory of user behavior, preferences, and web activity. The system uses RxDB with vector embeddings for intelligent storage and retrieval, enabling "perfect RAG answers" through context-aware AI responses and "proactive one-click agents" that offer smart suggestions based on user patterns.

The initial implementation focuses on data collection and storage infrastructure, establishing the memory layer that will power future AI enhancements. Users will experience improved AI responses that remember their browsing context and receive proactive suggestions through clickable UI elements.

## Goals

1. **Establish Memory Foundation**: Create a unified hybrid storage system using RxDB for vector embeddings and Dexie for structured data/metadata
2. **Enable Context-Aware AI**: Provide AI chat with access to user's browsing history and preferences for more relevant responses
3. **Deliver Proactive Assistance**: Implement background pattern detection that surfaces actionable suggestions via one-click UI elements
4. **Ensure Local-First Architecture**: Maintain all data locally with zero external dependencies beyond the specified tech stack
5. **Build Scalable Infrastructure**: Design the memory layer to support future features like memory search, analysis, and advanced RAG capabilities

## User Stories

### Primary User Stories

**As a frequent browser user,** I want the AI to remember my browsing context so that when I ask questions, it can reference relevant pages I've visited and provide more accurate, personalized responses.

**As someone who performs repetitive web tasks,** I want the browser to proactively suggest actions based on my patterns, so I can complete tasks more efficiently with one-click suggestions that appear in the UI.

**As a user engaging in research or complex workflows,** I want the AI to understand my activity across multiple tabs and sessions, so it can provide context-aware assistance that builds on my previous interactions.

### Secondary User Stories

**As a privacy-conscious user,** I want all my browsing data and AI interactions stored locally, so I maintain control over my personal information without external dependencies.

**As someone who switches between devices,** I want my personal brain to eventually sync across my devices, so my AI assistance feels consistent regardless of where I browse.

## Functional Requirements

### Core Memory Infrastructure

1. **Hybrid Storage System**: Implement RxDB with Dexie storage adapter for unified vector embeddings and structured metadata storage
2. **Vector Embeddings**: Use @xenova/transformers to generate embeddings for all captured content
3. **Unique ID Generation**: Use crypto.randomUUID() for all memory entries and relationships
4. **Local-First Design**: Ensure zero external dependencies with all processing happening client-side

### Data Capture and Storage

5. **Chat Message Capture**: Automatically capture all sidebar chat messages and store them in the memory layer upon completion
6. **Tab Content Capture**: Capture tab content on page load finish events and store in the memory layer
7. **Metadata Enrichment**: Store comprehensive metadata including timestamps, URLs, page titles, and content types
8. **Background Processing**: Implement efficient background capture that doesn't impact browsing performance

### AI Integration Foundation

9. **Context Enrichment**: Enable chat messages to be enriched with relevant memory data during processing
10. **Pattern Detection**: Trigger pattern detection analysis on every data capture event AND on a 5-minute interval to identify repetitive user workflows
11. **Proactive Suggestions**: Generate actionable suggestions from detected patterns and display them as non-intrusive toast notifications
12. **Memory Retrieval**: Provide top-5 most relevant memory chunks for each chat message

### User Experience

13. **Non-Intrusive Operation**: Ensure all capture and processing happens transparently without user interaction
14. **Performance Optimization**: Maintain browser responsiveness with efficient storage and retrieval operations
15. **Error Handling**: Gracefully handle storage failures and embedding generation errors

## Non-Goals (Out of Scope)

### Current Implementation Scope

- Browser-level data retrieval UI (search interfaces, memory panels, analysis tools)
- Cross-device synchronization
- Advanced memory visualization or analytics
- Manual memory management controls
- Export/import functionality
- Memory cleanup or retention policies

### Future Scope Items

- Integration of browser-level store for direct UI retrieval
- Dedicated memory panel/modal for searching and managing stored data
- Advanced pattern detection beyond basic behavioral analysis
- Memory-based proactive agents beyond one-click suggestions
- User-controlled memory management and privacy settings

## Design Considerations

### UI Integration

- Proactive suggestions should appear as unobtrusive toast notifications or inline UI elements
- One-click agents should integrate seamlessly with existing sidebar and topbar components
- Memory-enriched chat responses should feel natural and contextually relevant

### Performance Considerations

- Background processing should not impact page load times or user interaction responsiveness
- Storage operations should be asynchronous and non-blocking
- Memory retrieval should be fast enough to not delay chat responses

## Technical Considerations

### Architecture Integration

- Memory layer should integrate cleanly with existing Window, Tab, and LLMClient classes
- Use existing IPC patterns for communication between main and renderer processes
- Leverage current React Context patterns for state management in sidebar

### Dependencies and Stack

- RxDB with rx-storage-dexie for hybrid storage
- @xenova/transformers for client-side embedding generation
- crypto.randomUUID() for ID generation (native browser API)
- Zero additional external dependencies

### Data Structure

- Design schema for memory entries including content, embeddings, metadata, and relationships
- Implement efficient indexing for fast retrieval operations
- Plan for scalable storage as memory accumulates over time

## Success Metrics

1. **AI Response Accuracy**: AI chat responses show measurable improvement in relevance and personalization through memory integration
2. **Time Efficiency**: Users spend less time re-finding information or repeating actions due to proactive suggestions
3. **User Engagement**: Increased interaction with AI features and proactive suggestions
4. **Task Completion**: Measurable improvement in user efficiency for repetitive or complex web-based tasks
5. **Performance Impact**: No degradation in browser performance or responsiveness with memory layer active
6. **Data Capture Rate**: Successful capture and storage of 95%+ of chat messages and page loads

## Open Questions

1. **Storage Limits**: What are the practical limits for local storage of embeddings and metadata?
2. **Embedding Strategy**: Which content should be embedded (full text, summaries, key phrases) for optimal retrieval?
3. **Pattern Detection**: What specific patterns should trigger proactive suggestions (form filling, navigation sequences, search patterns)?
4. **Privacy Boundaries**: How to handle sensitive content in memory (passwords, personal data) without compromising utility?
5. **Performance Benchmarks**: What are acceptable latency thresholds for memory retrieval during chat responses?
