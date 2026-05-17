# Requirements Document

## Introduction

This feature adds an anime wallpaper plugin to the WADASHV2 WhatsApp bot. Users can search and retrieve anime wallpapers from multiple sources (WallHaven, ZeroChan, Wallpapers.com, Pinterest, Moe Walls, Hoyolab) and get random wallpapers via the `anime-wallpaper` npm package. The plugin follows the existing WADASHV2 plugin architecture and sends results as image messages in the chat.

## Glossary

- **Bot**: The WADASHV2 WhatsApp bot application
- **Plugin**: A module in `src/engine/plugins/` that exports `command`, `category`, and `execute` to handle user commands
- **User**: A WhatsApp user interacting with the Bot
- **AnimeWallpaper_Client**: An instance of the `AnimeWallpaper` class from the `anime-wallpaper` npm package
- **Source**: A wallpaper provider (WallHaven, ZeroChan, Wallpapers.com, Pinterest, Moe Walls, Hoyolab, Hqdwalls)
- **Search_Query**: The text argument provided by the User after the command to specify what wallpaper to search for
- **JID**: The WhatsApp chat identifier (remoteJid) where the command was received

## Requirements

### Requirement 1: Search Anime Wallpapers

**User Story:** As a User, I want to search for anime wallpapers by keyword, so that I can receive relevant anime wallpaper images in the chat.

#### Acceptance Criteria

1. WHEN the User sends a command with a Search_Query of 1 to 100 characters, THE Plugin SHALL search for wallpapers matching the Search_Query using the AnimeWallpaper_Client
2. WHEN the AnimeWallpaper_Client returns one or more results, THE Plugin SHALL select the first result and send it to the JID as an image message with a caption containing the source name, quoted to the original message
3. IF the AnimeWallpaper_Client returns no results, THEN THE Plugin SHALL send a text message to the JID indicating no wallpapers were found for the given Search_Query
4. IF the Search_Query is empty (no arguments provided), THEN THE Plugin SHALL send a text message to the JID stating the command name followed by the expected argument format
5. IF the AnimeWallpaper_Client throws an error or fails to respond within 15 seconds, THEN THE Plugin SHALL send a text message to the JID indicating that the search failed due to a service error

### Requirement 2: Source Selection

**User Story:** As a User, I want to choose which wallpaper source to search from, so that I can get wallpapers from my preferred provider.

#### Acceptance Criteria

1. WHEN the User provides a source identifier as the first argument before the Search_Query (e.g., `!wp zerochan Misaka`) or via a `--source` flag (e.g., `!wallpaper --source wallhaven Keqing`), THE Plugin SHALL search only from the specified Source using the corresponding AnimeSource enum value
2. THE Plugin SHALL support the following sources with case-insensitive matching of accepted input identifiers: "wallhaven" for WallHaven, "zerochan" for ZeroChan, "wallpapers" for Wallpapers.com, "pinterest" for Pinterest, and "moewalls" for Moe Walls
3. WHEN no source identifier is specified in the command arguments, THE Plugin SHALL use WallHaven as the default Source
4. IF the User specifies a source identifier that does not match any of the accepted input identifiers listed in criterion 2, THEN THE Plugin SHALL send a text message to the JID listing all accepted source identifiers and their corresponding provider names
5. IF a valid source is specified but no Search_Query is provided after the source identifier, THEN THE Plugin SHALL send a text message to the JID explaining that a search term is required along with the correct usage format

### Requirement 3: Random Wallpaper

**User Story:** As a User, I want to get a random anime wallpaper without specifying a search term, so that I can discover new wallpapers easily.

#### Acceptance Criteria

1. WHEN the User sends the random wallpaper command without a Search_Query, THE Plugin SHALL retrieve a random wallpaper from Hqdwalls using the AnimeWallpaper_Client
2. WHEN the AnimeWallpaper_Client returns a random wallpaper, THE Plugin SHALL send the wallpaper image to the JID as an image message with a caption containing the source name "Hqdwalls"
3. THE Plugin SHALL request random wallpapers with a resolution of "1920x1080"
4. IF the AnimeWallpaper_Client returns no wallpaper data or throws an error during random retrieval, THEN THE Plugin SHALL send a text message to the JID indicating that a random wallpaper could not be retrieved

### Requirement 4: Command Registration

**User Story:** As a User, I want to invoke the wallpaper feature using intuitive command aliases, so that I can easily remember how to use the feature.

#### Acceptance Criteria

1. THE Plugin SHALL register with the command aliases ["wallpaper", "wp", "animewp"] where "wallpaper" is the primary alias displayed in category menus
2. THE Plugin SHALL register under the category "anime"
3. THE Plugin SHALL export a named `command` property of type string array, a named `category` property of type string, and a named `execute` function with signature (sock, msg, args, settings) => Promise<void> conforming to the Plugin interface
4. WHEN a user sends a message matching any of the registered aliases, THE Plugin SHALL be discoverable in the plugin registry for that alias

### Requirement 5: Error Handling

**User Story:** As a User, I want to receive clear error messages when something goes wrong, so that I understand why the wallpaper was not delivered.

#### Acceptance Criteria

1. IF the AnimeWallpaper_Client throws an error during search or retrieval, THEN THE Plugin SHALL send a text message to the JID that includes the error type or message from the caught exception and the Search_Query that was attempted, quoting the original user message
2. IF a network timeout occurs (no response received within 30 seconds) while fetching the wallpaper image, THEN THE Plugin SHALL send a text message to the JID indicating a connection timeout occurred, quoting the original user message
3. IF any error occurs during command execution, THEN THE Plugin SHALL log the error to the console with a "[Wallpaper]" prefix followed by the error message
4. IF the AnimeWallpaper_Client returns a malformed or unparseable response, THEN THE Plugin SHALL send a text message to the JID indicating the source returned an invalid response, quoting the original user message

### Requirement 6: Message Delivery

**User Story:** As a User, I want the bot to feel natural when sending wallpapers, so that the interaction feels human-like.

#### Acceptance Criteria

1. THE Plugin SHALL use the `sendWithTyping` utility from `./utils` to send all messages (both text and image), passing the socket instance, the JID, the message content object, and the options object as arguments
2. WHEN sending an image message, THE Plugin SHALL pass the message content as `{ image: { url: <wallpaper_url> }, caption: <caption_text> }` where the caption contains the wallpaper source name and the Search_Query used
3. THE Plugin SHALL pass `{ quoted: msg }` as the options argument to `sendWithTyping` for every message sent (both text responses and image responses), so that the reply references the original user command message
4. IF the image URL fails to load or the buffer is empty, THEN THE Plugin SHALL send a text message to the JID indicating that the wallpaper image could not be delivered
