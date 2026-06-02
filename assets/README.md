# Web assets

- `css/`: site styles.
- `js/`: site interactions.
- `images/`: exported images used by the pages.

Source design files are kept in `../../source/` at the `ui-web` root.

## Style switching

Two global style files are kept in `css/`:

- `site.css`: default/original site style.
- `site-editorial.css`: editorial portfolio/archive style with paper texture, grid details, stronger typography, and sample-sheet project cards.

Pages currently load `site.css` by default. To switch a page to the editorial style, update its stylesheet link:

```html
<link rel="stylesheet" href="assets/css/site-editorial.css">
```

For pages inside `projects/`, use the parent-directory path:

```html
<link rel="stylesheet" href="../assets/css/site-editorial.css">
```

To switch back, replace `site-editorial.css` with `site.css`.
