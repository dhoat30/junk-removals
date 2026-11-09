# Areas covered section

The homepage displays `AreasCoveredSection` after the service cards. It groups example suburbs under Central Auckland, North Shore, West Auckland, East Auckland, South Auckland, and Hibiscus Coast. The copy makes clear the list is not exhaustive and coverage is Auckland-wide. The quote button links to the hero form.

Default content is in `utils/aucklandCoverage.js`. Titles, descriptions, and suburb names use MUI Typography.

For CMS management, add an ACF flexible-content layout named `areas_covered`:

- `title`: text
- `description`: plain text
- `areas`: repeater containing `title` (text) and `suburbs` (repeater with a `name` text field)
- `quote_link`: optional ACF link

The component also accepts an array of plain strings for suburbs. A CMS `areas_covered`, `locations_covered`, or enabled `show_locations` section suppresses the default homepage coverage section to avoid duplication. Other existing location components are unchanged.
