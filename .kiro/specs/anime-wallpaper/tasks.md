# Implementation Plan: Anime Wallpaper Plugin

## Overview

This plan implements the anime-wallpaper plugin for the WADASHV2 WhatsApp bot. The plugin integrates the `anime-wallpaper` npm package to provide wallpaper search and random retrieval capabilities. It follows the existing single-file plugin pattern (`ping.ts`, `sticker.ts`) and registers under the "anime" category with aliases `wallpaper`, `wp`, and `animewp`.

## Tasks

- [x] 1. Install dependency and create plugin file with core exports
  - [x] 1.1 Install the `anime-wallpaper` npm package and create `src/engine/plugins/wallpaper.ts` with command, category exports and empty execute function
    - Run `npm install anime-wallpaper` (or bun equivalent)
    - Create `src/engine/plugins/wallpaper.ts`
    - Export `command = ['wallpaper', 'wp', 'animewp']`
    - Export `category = 'anime'`
    - Export `execute` function with correct signature `(sock, msg, args, settings) => Promise<void>`
    - Import `sendWithTyping` from `./utils`
    - Import `AnimeWallpaper` and `AnimeSource` from `anime-wallpaper`
    - Instantiate `AnimeWallpaper` client at module level
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 1.2 Register the wallpaper plugin in `src/engine/plugins/index.ts`
    - Add `import * as wallpaper from './wallpaper'` to the imports section
    - Add `wallpaper` to the `pluginList` array
    - _Requirements: 4.4_

- [x] 2. Implement argument parsing and source resolution
  - [x] 2.1 Implement the `SOURCE_MAP` constant and `resolveSource` function
    - Define `SOURCE_MAP` as `Record<string, AnimeSource>` with keys: wallhaven, zerochan, wallpapers, pinterest, moewalls
    - Implement `resolveSource(input: string): AnimeSource | null` that lowercases input and looks up in SOURCE_MAP
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement the `parseArgs` function returning a `ParsedCommand` discriminated union
    - Define `ParsedCommand` type with variants: `search`, `random`, `usage`, `invalid_source`, `missing_query`
    - If args is empty → return `{ type: 'usage' }`
    - If first arg is "random" (case-insensitive) → return `{ type: 'random' }`
    - If first arg matches `--source` flag, extract source from second arg and query from remaining args
    - If first arg matches a source identifier, extract query from remaining args
    - If source is valid but no query remains → return `{ type: 'missing_query', source }`
    - If source identifier is invalid → return `{ type: 'invalid_source', input }`
    - Otherwise treat all args as query with default WallHaven source → return `{ type: 'search', source, query }`
    - _Requirements: 1.4, 2.1, 2.3, 2.4, 2.5_

  - [ ]* 2.3 Write property test for case-insensitive source resolution
    - **Property 3: Case-insensitive source resolution**
    - Use `fast-check` to generate arbitrary case variations of valid source identifiers
    - Assert `resolveSource` returns the same enum value regardless of casing
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.4 Write property test for invalid source rejection
    - **Property 4: Invalid source rejection**
    - Use `fast-check` to generate arbitrary strings that are NOT valid source identifiers
    - Assert `resolveSource` returns `null` for all such strings
    - **Validates: Requirements 2.4**

- [x] 3. Implement timeout utility and wallpaper retrieval functions
  - [x] 3.1 Implement the `withTimeout` generic helper function
    - Implement `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>` using `Promise.race`
    - Create a rejecting timer that throws a timeout error after `ms` milliseconds
    - Clear the timer on successful resolution
    - _Requirements: 1.5, 5.2_

  - [x] 3.2 Implement `searchWallpaper` function wrapping AnimeWallpaper.search with 15s timeout
    - Call `client.search({ title: query, source })` wrapped in `withTimeout(..., 15000)`
    - Return the first result from the results array
    - Throw if results array is empty
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 3.3 Implement `getRandomWallpaper` function wrapping AnimeWallpaper.random with 15s timeout
    - Call `client.random({ resolution: "1920x1080" })` wrapped in `withTimeout(..., 15000)`
    - Return the wallpaper result
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Checkpoint - Ensure all code compiles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the main execute function logic
  - [x] 5.1 Implement the execute function dispatching on ParsedCommand type
    - Call `parseArgs(args)` to get the parsed command
    - For `usage` → send usage text via `sendWithTyping` with `{ quoted: msg }`
    - For `invalid_source` → send text listing all valid sources via `sendWithTyping` with `{ quoted: msg }`
    - For `missing_query` → send text explaining search term is required via `sendWithTyping` with `{ quoted: msg }`
    - For `random` → call `getRandomWallpaper()`, send image message `{ image: { url }, caption: "Source: Hqdwalls" }` via `sendWithTyping` with `{ quoted: msg }`
    - For `search` → call `searchWallpaper(query, source)`, send image message `{ image: { url }, caption }` containing source name and query via `sendWithTyping` with `{ quoted: msg }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4, 2.5, 3.1, 3.2, 6.1, 6.2, 6.3_

  - [x] 5.2 Implement error handling in the execute function with try/catch
    - Wrap the dispatch logic in try/catch
    - On timeout error → send "Connection timeout" text via `sendWithTyping` with `{ quoted: msg }`
    - On malformed response (result missing image URL) → send "Source returned invalid response" text via `sendWithTyping` with `{ quoted: msg }`
    - On generic error → send error message including error.message and the query via `sendWithTyping` with `{ quoted: msg }`
    - Always log errors with `console.error('[Wallpaper] ...')` prefix
    - _Requirements: 1.5, 5.1, 5.2, 5.3, 5.4, 6.3, 6.4_

  - [ ]* 5.3 Write property test for search dispatch correctness
    - **Property 1: Search dispatch correctness**
    - Mock `AnimeWallpaper.search` and verify it is called with correct title and source enum for any valid query/source combination
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 5.4 Write property test for first result selection and image format
    - **Property 2: First result selection and image format**
    - Generate arbitrary non-empty arrays of wallpaper results
    - Assert the sent image URL equals the first result's `image` field and caption contains source name
    - **Validates: Requirements 1.2, 6.2**

  - [ ]* 5.5 Write property test for error messages include context
    - **Property 5: Error messages include context**
    - Generate arbitrary error messages and query strings
    - Mock client to throw, assert sent text contains both error substring and query
    - **Validates: Requirements 5.1**

  - [ ]* 5.6 Write property test for console logging with prefix
    - **Property 6: Console logging with prefix**
    - Generate arbitrary errors, assert `console.error` is called with string starting with "[Wallpaper]"
    - **Validates: Requirements 5.3**

  - [ ]* 5.7 Write property test for message delivery invariant
    - **Property 7: Message delivery invariant**
    - For any execution path, assert every `sendWithTyping` call includes `{ quoted: msg }` in options
    - **Validates: Requirements 6.1, 6.3**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The plugin follows the exact same pattern as `ping.ts` — single file, module-level exports, `sendWithTyping` for delivery
- The `anime-wallpaper` package provides `AnimeWallpaper` class and `AnimeSource` enum
- All messages must be quoted to the original message (`{ quoted: msg }`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.5", "5.6", "5.7"] }
  ]
}
```
