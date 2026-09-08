# HealthCore Public Website

This folder contains HealthCore's public-facing website for patients and visitors. It is separate from the future internal `backoffice` application under `uis/`.

## Current scope

The current milestone includes:

- A responsive home page for desktop, tablet, and mobile
- A shared-style header with the HealthCore logo, navigation, language selector, and account link
- A hamburger navigation menu for mobile and tablet
- A hero section with appointment and location calls to action
- Key outpatient care benefits
- A contact call to action and professional footer

The Services, Locations, Contact, and appointment enquiry experiences will be implemented in later milestones.

## Technology

- Semantic HTML5
- Tailwind CSS through the CDN
- Lucide icons through the CDN
- Vanilla JavaScript for the responsive navigation menu

No build step is currently required.

## Project structure

```text
website/
├── index.html
├── application.html
├── validation.js
├── README.md
└── public/
	├── images/
	│   └── home-hero.jpg
	└── screenshots/
		└── home/
			├── home_desktop.PNG
			├── home_mobile.PNG
			├── home_mobile_tablet_menu.PNG
			└── home_tablet.PNG
```

`application.html` and `validation.js` are reserved for the future appointment enquiry form.

## Run the website

From the repository root, start a local static server with:

```powershell
npx serve uis/website
```

The first run may ask for permission to download the `serve` package. This package is run through the npm cache and is not added to the project dependencies.

Open the local URL printed in the terminal, usually:

```text
http://localhost:3000
```

Press `Ctrl+C` in the terminal to stop the server.

Alternatively, run the website with Python without downloading an npm package:

```powershell
python -m http.server 8000 --directory uis/website
```

Then open `http://localhost:8000`.

## HealthCore home UI/UX reference

The screenshots in [`public/screenshots/home`](./public/screenshots/home/) are the visual reference for implementing and reviewing the HealthCore home page. The interface uses a calm healthcare palette with navy primary actions, teal accents, pale blue surfaces, generous whitespace, and clear typography.

### Desktop

![HealthCore home page on desktop](./public/screenshots/home/home_desktop.PNG)

- The top header displays the compact HealthCore logo, centered navigation links, language selector, and account icon.
- The hero uses a two-column layout: headline, description, calls to action, and benefits on the left; patient photography and accreditation details on the right.
- The footer places company information on the left and contact and social links on the right.

### Tablet

![HealthCore home page on tablet](./public/screenshots/home/home_tablet.PNG)

- The hero changes to a single-column layout, with the text and actions above the image.
- The main navigation moves into a hamburger menu while the logo, language selector, and account icon remain visible.
- Benefit items remain in a three-column row beneath the hero image.

### Mobile

![HealthCore home page on mobile](./public/screenshots/home/home_mobile.PNG)

- Content is stacked vertically for a narrow viewport, with readable spacing and no horizontal scrolling.
- Both calls to action become full-width controls for easier touch interaction.
- The hero image follows the text and actions, while the accreditation panel remains overlaid near the bottom of the image.

### Mobile and tablet menu

![HealthCore mobile and tablet navigation menu](./public/screenshots/home/home_mobile_tablet_menu.PNG)

- The hamburger opens the primary navigation directly beneath the top header.
- Home, Services, Locations, and Contact appear as large vertical menu targets.
- The active page uses a pale blue background, and the menu does not replace or hide the header controls.