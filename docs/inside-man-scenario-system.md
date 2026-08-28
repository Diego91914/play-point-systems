# Inside Man scenario system

The MVP scenario contract is intentionally small so future content packs can be moved from code into database rows without changing gameplay APIs.

Each scenario contains:

- stable `id`
- display `title`
- shared `setup`
- six `choices`
- `pick` count (MVP: three)
- three `required` choice indexes that define mission success

At match creation, five unique scenario IDs are shuffled from the launch pool. At the beginning of each mission, every Crew player receives a private target drawn from the required choices, while the Inside Man receives a private target drawn from the non-required choices.

This makes the same scenario behave differently depending on the assigned private targets, player personalities, discussion, and vote distribution.
