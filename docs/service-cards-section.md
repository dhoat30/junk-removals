# Service cards section

`ServiceCardsSection` uses MUI Typography for the section heading (`h2`), service titles (`h3`), and body text. The default content is the eight supplied Google ad-group names and their one-liners in `utils/junkRemovalServices.js`. Titles are rendered exactly as supplied.

The homepage inserts the section immediately after the hero until a `service_cards` ACF flexible layout block exists. Once the CMS block is present, its position and content take precedence and the default section is not duplicated. Each default "Get a price" button links to the existing hero quote form (`/#get-free-quote`).

## ACF layout contract

Add a flexible-content layout named `service_cards` with:

- `title`: text; default "Whatever needs to go"
- `description`: optional plain text
- `cards`: repeater with `title` (text), `description` (plain text), `icon` (optional select), and `cta_link` (optional ACF link)
- `quote_link`: optional ACF link used when a card has no custom link

Icon choices: `household`, `furniture`, `appliances`, `garden`, `clearance`, `estate`, `tenancy`, and `building`.

Card and section names stay in the website code/CMS; this change does not create or modify Google Ads ad groups.
