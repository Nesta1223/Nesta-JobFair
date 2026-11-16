# UML diagrams

Editable `.puml` sources are rendered with [PlantUML](https://plantuml.com/download). PNG files are convenient previews; SVG files can be zoomed without losing clarity. Slides use compact editable diagrams; these files supply additional detail.

- `use-case`: required actors and operations (extra CSV intentionally excluded from required diagram).
- `api-profile`: Application/Resource/Path/HTTP/Representation stereotypes from Chapter06.
- `create-booking`: authentication, validation, quota and persistence.
- `authorization`: read/edit/delete owner or admin check.

Render with an official PlantUML JAR and Java: `java -jar plantuml.jar -tsvg "docs/diagrams/*.puml"` (or `-tpng`). No private code is sent to a rendering server.
