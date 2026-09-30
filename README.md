# Sunday Sinner

A cinematic, atmospheric artist website for a fictionalized independent musician persona. The site is built as a static HTML/CSS/JS project with a dark, late-night road aesthetic inspired by gritty country-rock, Southern storytelling, and emotional indie cinema.

## Project structure

```text
/
├── index.html
├── merch.html
├── merch-item.html
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   └── merch.js
├── data/
│   └── merch.js
├── assets/
│   └── images/
│       └── merch/
│           └── placeholder.svg
├── README.md
└── .gitignore
```

## How to run locally

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in your real SMTP and email values:

```bash
cp .env.example .env
```

3. Start the site server:

```bash
npm start
```

Then open:

```text
http://localhost:8000
```

The site now serves the static pages and the contact forms submit to `/api/contact` so they can be emailed to you once the SMTP values are configured.

## Adding new merch

This project uses a single merch data file so you can add products without editing the HTML every time.

### 1. Put the image in the merch folder

Place product artwork in:

```text
assets/images/merch/
```

For example:

```text
assets/images/merch/freeway-to-heaven-tee.jpg
```

### 2. Open the merch data file

Edit:

```text
data/merch.js
```

### 3. Copy an existing product object

Use one of the current objects as a template and change the values.

### 4. Update the product fields

At minimum, change:

- `id`
- `name`
- `category`
- `price`
- `image`
- `description`
- `status`
- `link`

Example:

```js
{
  id: "freeway-to-heaven-tee",
  name: "Freeway to Heaven Tee",
  category: "T-Shirts",
  price: "$30",
  image: "assets/images/merch/freeway-to-heaven-tee.jpg",
  description: "A distressed Sunday Sinner design inspired by the Highway to Hell song.",
  status: "coming-soon",
  link: "",
  featured: true
}
```

### 5. Save the file

Save `data/merch.js`.

### 6. Refresh the website

Open the merch page and the new item appears automatically.

## Merch behavior and statuses

The merch system supports the following product states:

- `available` — show `AVAILABLE`
- `coming-soon` — show `COMING SOON`
- `sold-out` — show `SOLD OUT` and disable the purchase link

If a product has a valid `link`, the product page shows a `Buy Now` button. If not, it shows `Coming Soon`.

## Image fallback

If an image is missing, the site does not show a broken image icon. Instead it automatically falls back to:

```text
assets/images/merch/placeholder.svg
```

This keeps the site working cleanly until real product art is added.

## Where to put images and music

Place new artwork and gallery images in `assets/images/`.

- Use `.jpg`, `.png`, or `.svg` files.
- Keep filenames descriptive and consistent.
- Product imagery for merch belongs in `assets/images/merch/`.

## Where to put music

Put audio files in `assets/music/`.

- For example: `assets/music/where-the-road-ends.mp3`
- The current track controls are intentionally disabled placeholders so the site can accept real audio later without breaking the layout.
- Each track card is structured so you can swap in real audio files when they are ready.

## How to change social links

Open `index.html` and edit the placeholder links inside the social section.

```html
<a href="#" aria-label="Spotify placeholder">Spotify</a>
```

Replace the `#` value with the correct URL when available.

## How to change contact information

Open `index.html` and update the email placeholders in the contact section.

Example:

```html
<a href="mailto:booking@example.com">[booking@example.com]</a>
```

These are intentionally labeled as placeholders, as requested for privacy-safe front-end work.

## How to edit songs

The track list and descriptions live in `index.html` under the `#music` section.

To update a song:

1. Locate the matching `<article class="track">` element.
2. Change the track title and description.
3. Update the track number if needed.
4. Keep the play button disabled until a real MP3 file exists.

## How to deploy the site

This project is static and can be deployed on any standard web host or static site service.

Examples:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any CDN or basic web server

Upload the project folder as-is and keep the relative paths intact.

## Notes

- The design intentionally avoids fake personal details or real private information.
- The visual style uses dark tones, dusty neutrals, red highlights, and atmospheric textures to match the artist's identity.
- The gallery and hero intentionally use CSS-generated backgrounds and SVG placeholders when real assets are not yet available.
- The merch system is intentionally designed to be easy to expand without editing the page HTML for every new product.
