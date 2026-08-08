---
name: Fyther Store
description: A high-performance editorial storefront built around movement and precise commerce.
colors:
  obsidian: "#0b0d0e"
  bone: "#f4f3ef"
  volt: "#b8ff3d"
  graphite: "#232628"
  titanium: "#73797d"
  pure: "#ffffff"
  error: "#a62c2c"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(3.2rem, 8vw, 7.5rem)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "0"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0"
rounded:
  control: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.pure}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
    height: "48px"
  button-accent:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.obsidian}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
    height: "48px"
  input:
    backgroundColor: "{colors.pure}"
    textColor: "{colors.obsidian}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "48px"
---

# Design System: Fyther Store

## Overview

**Creative North Star: "The Performance Editorial"**

Fyther feels like a calm sports magazine that can complete a purchase. Large, decisive type and real campaign media create energy; disciplined grids, honest labels and restrained controls keep the commercial path precise. The visual world rejects generic ecommerce cards, decorative gradients and unsupported claims.

**Key Characteristics:** editorial scale, flat surfaces, sharp contrast, one electric accent, functional motion and visible product truth.

## Colors

Bone and Obsidian carry almost the entire interface. Volt is a rare action and momentum signal.

- **Obsidian** (`#0b0d0e`): primary text, dark sections and structural controls.
- **Bone** (`#f4f3ef`): main page surface.
- **Volt** (`#b8ff3d`): primary action, active status and editorial emphasis.
- **Graphite** (`#232628`): secondary dark band and fallback media.
- **Titanium** (`#73797d`): secondary metadata.
- **Pure** (`#ffffff`): input and high-contrast text surface.
- **Error** (`#a62c2c`): validation and failure state.

**The Volt Rule.** Use Volt for the next meaningful action or one decisive phrase, never as a general background theme.

## Typography

**Display Font:** Archivo, sans-serif
**Body Font:** Manrope, sans-serif

Archivo makes short statements feel athletic without becoming aggressive. Manrope keeps catalog, checkout and policy content compact and legible. Letter spacing remains zero throughout.

- **Display** (800, responsive clamp, 0.94): hero and section statements only.
- **Title** (700-800, `1rem` to `2rem`): product and operational headings.
- **Body** (400, `16px`, 1.55): copy with a preferred measure below 64 characters.
- **Label** (800, `0.7rem`): concise uppercase locators and metadata.

## Layout

The maximum content width is `1440px`; horizontal gutters grow from `16px` on mobile to `64px` on wide screens. Desktop compositions use asymmetric two-column editorial grids and three-column product grids. Below `767px`, sections stack, product highlights become a horizontal rail and task flows become single-column. Fixed-format media uses explicit aspect ratios or stable minimum heights.

## Elevation & Depth

The system is flat by design and uses no shadows. Depth comes from photographic media, dark tonal bands, borders and sticky operational summaries. Hover feedback uses color and transform only.

## Shapes

Controls use a restrained `4px` radius. Product media, editorial sections and information bands remain square. Borders are thin and low contrast; pills are reserved for compact category filters where the shape communicates selection.

## Components

- **Buttons:** 48px minimum height, compact bold labels, Obsidian default or Volt primary action, visible focus ring and short press scale.
- **Inputs:** white field, 4px radius, dark 1px border, persistent visible label and stronger border on focus.
- **Product cards:** unframed vertical composition, 4:5 media, factual category/name/price row and a separate action row.
- **Navigation:** centered desktop links, 44px targets and a stacked mobile menu opened by a Lucide icon button.
- **Commerce notices:** concise bordered bands that distinguish demo, empty and error states without impersonating live inventory.

## Do's and Don'ts

### Do

- **Do** preserve the Bone, Obsidian and Volt hierarchy.
- **Do** keep product data, payment methods and stock sourced from BilBildin in live mode.
- **Do** use real media and Lucide icons with descriptive accessible labels.
- **Do** maintain 44px minimum interaction targets and reduced-motion behavior.

### Don't

- **Don't** add gradients, decorative blobs, nested cards or floating section containers.
- **Don't** use Volt as a dominant page color or introduce another dominant hue family.
- **Don't** invent products, reviews, shipping promises, payment methods or availability.
- **Don't** use negative letter spacing, emoji icons or layout-changing hover animation.
